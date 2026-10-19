import assert from 'node:assert/strict';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {createRun, advance} from '../core/engine.js';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
  throw Error('Teste permitido apenas no emulador local.');
initializeApp({projectId: 'demo-voaporco'});
const db = getFirestore();
async function user() {
  const r = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: `qa-${crypto.randomUUID()}@example.test`,
        password: crypto.randomUUID(),
        returnSecureToken: true,
      }),
    },
  );
  const d = await r.json();
  assert.ok(d.idToken);
  return d;
}
async function call(u, name, data = {}) {
  const r = await fetch(`http://127.0.0.1:5001/demo-voaporco/southamerica-east1/${name}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${u.idToken}`},
    body: JSON.stringify({data}),
  });
  const d = await r.json();
  if (d.error) throw Error(d.error.message);
  return d.result;
}
const a = await user(),
  b = await user(),
  c = await user();
for (const u of [a, b, c]) await call(u, 'ensureProfile');
assert.equal((await call(a, 'setNickname', {nickname: 'Porco Teste'})).nickname, 'Porco Teste');
const ticket = await call(a, 'beginRun', {mapId: 'cipo', skinId: 'mandrake', level: 'normal'});
const run = createRun(ticket.seed, 'normal');
while (!run.dead) advance(run);
await db.doc(`runs/${ticket.id}`).update({startAt: Date.now() - 10000});
await assert.rejects(() => call(b, 'settleRun', {runId: ticket.id, inputs: [], ticks: run.tick}));
await assert.rejects(() =>
  call(a, 'settleRun', {runId: ticket.id, inputs: [], ticks: run.tick + 100}),
);
const first = await call(a, 'settleRun', {runId: ticket.id, inputs: [], ticks: run.tick});
const duplicate = await call(a, 'settleRun', {runId: ticket.id, inputs: [], ticks: run.tick});
assert.equal(first.profile.runs, duplicate.profile.runs);
await db.doc(`profiles/${a.localId}`).update({coins: 100});
assert.equal((await call(a, 'continueRun', {runId: ticket.id, tick: run.tick})).profile.coins, 75);
assert.equal((await call(a, 'continueRun', {runId: ticket.id, tick: run.tick})).profile.coins, 75);
const room = (await call(a, 'createRoom')).room;
assert.match(room.code, /^\d{6}$/);
const joined = await Promise.all([
  call(b, 'joinRoom', {code: room.code}),
  call(c, 'joinRoom', {code: room.code}),
]);
assert.equal(joined.filter(x => !x.error).length, 1);
const rival = joined[0].error ? c : b;
await call(a, 'readyRoom', {code: room.code});
const race = (await call(rival, 'readyRoom', {code: room.code})).room;
assert.equal(race.state, 'racing');
assert.equal(race.members.length, 2);
await db.doc(`rooms/${room.code}`).update({startAt: Date.now() - 100000, seed: 19});
const duel = createRun(19, 'normal', true),
  duelInputs = [];
while (!duel.dead && duel.passed < 3) {
  const target = duel.gates.find(g => g.x > -1)?.center ?? 1;
  const flap = duel.y < target - 0.5 && duel.v < 0;
  if (flap) duelInputs.push(duel.tick);
  advance(duel, flap);
}
assert.ok(duel.passed > 0);
assert.ok(duel.coins > 0);
await call(a, 'duelTick', {code: room.code, inputs: duelInputs, ticks: duel.tick, quit: true});
const finish = (
  await call(rival, 'duelTick', {code: room.code, inputs: duelInputs, ticks: duel.tick, quit: true})
).room;
assert.equal(finish.state, 'finished');
assert.equal(finish.winner, 'draw');
const earned = (await db.doc(`profiles/${a.localId}`).get()).data();
assert.equal(earned.coins, 75 + duel.coins);
assert.equal(earned.runs, 2);
await call(a, 'duelTick', {code: room.code});
assert.equal((await db.doc(`profiles/${a.localId}`).get()).data().coins, earned.coins);
// Client REST must not read another private profile or mint coins.
const base = 'http://127.0.0.1:8080/v1/projects/demo-voaporco/databases/(default)/documents';
const headers = {Authorization: `Bearer ${b.idToken}`, 'Content-Type': 'application/json'};
assert.equal((await fetch(`${base}/profiles/${a.localId}`, {headers})).status, 403);
assert.equal(
  (
    await fetch(`${base}/profiles/${b.localId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({fields: {coins: {integerValue: '99999'}}}),
    })
  ).status,
  403,
);
console.log(
  'PASS: perfis, replay, propriedade, crédito idempotente, continue, disputa de vaga, largada, empate e regras Firestore.',
);
