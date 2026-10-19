import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRun, advance} from '../core/engine.js';
const base = process.env.ONLINE_TEST_URL || 'http://127.0.0.1:8787';
const call = async (name, data = {}, token) => {
  const response = await fetch(`${base}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return {status: response.status, ...result};
};
const name = `qa_${randomBytes(5).toString('hex')}`,
  pass = randomBytes(20).toString('hex');
const registered = await call('register', {username: name, password: pass});
assert.equal(registered.status, 200, JSON.stringify(registered));
assert.equal(registered.profile.coins, 0);
assert.ok(registered.recovery);
assert.equal((await call('login', {username: name, password: 'wrong-password'})).status, 401);
const login = await call('login', {username: name.toUpperCase(), password: pass});
assert.equal(login.user.uid, registered.user.uid);
assert.equal((await call('buyItem', {id: 'delivery', kind: 'skin'}, login.token)).status, 400);
const runTicket = await call(
  'beginRun',
  {mapId: 'cipo', skinId: 'worker', level: 'normal'},
  login.token,
);
// Free starter skin is resolved from authoritative catalog below if its id changes.
if (runTicket.status !== 200) {
  const {SKINS} = await import('../core/catalog.js');
  Object.assign(
    runTicket,
    await call(
      'beginRun',
      {mapId: 'cipo', skinId: SKINS.find(s => !s.cost).id, level: 'normal'},
      login.token,
    ),
  );
}
assert.equal(runTicket.status, 200);
const run = createRun(runTicket.seed, 'normal');
while (!run.dead) advance(run, false);
await new Promise(resolve => setTimeout(resolve, Math.max(0, (run.tick / 120) * 1000 - 1000)));
const result = await call(
  'settleRun',
  {runId: runTicket.id, ticks: run.tick, inputs: []},
  login.token,
);
assert.equal(result.status, 200);
assert.equal(result.profile.runs, 1);
assert.equal(
  (await call('settleRun', {runId: runTicket.id, ticks: run.tick, inputs: []}, login.token)).profile
    .runs,
  1,
);
const guest = await call('guest', {nickname: 'Rival visitante'}),
  guest2 = await call('guest', {nickname: 'Outro visitante'}),
  outsider = await call('guest', {nickname: 'Intruso teste'});
assert.equal(
  (await call('beginRun', {mapId: 'cipo', skinId: 'worker', level: 'normal'}, guest.token)).status,
  400,
);
const room = await call('createRoom', {}, guest.token);
assert.match(room.room.code, /^\d{6}$/);
const joined = await call('joinRoom', {code: room.room.code}, guest2.token);
assert.equal(joined.room.members.length, 2);
assert.equal(
  (await call('joinRoom', {code: room.room.code}, outsider.token)).error,
  'Sala cheia ou já iniciada.',
);
assert.equal((await call('duelTick', {code: room.room.code}, outsider.token)).status, 400);
const {ticket} = await call('socketTicket', {}, guest.token);
const ws = new WebSocket(`${base.replace('http', 'ws')}/live?ticket=${ticket}`);
const updates = [];
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
ws.onmessage = e => updates.push(JSON.parse(e.data));
ws.send(JSON.stringify({type: 'watch', room: room.room.code}));
await call('readyRoom', {code: room.room.code}, guest.token);
const ready = await call('readyRoom', {code: room.room.code}, guest2.token);
assert.equal(ready.room.state, 'racing');
assert.ok(ready.room.startAt > ready.serverNow);
await new Promise(r => setTimeout(r, 100));
assert.ok(
  updates.some(u => u.room?.state === 'racing'),
  'realtime room update',
);
const duel = createRun(ready.room.seed, 'normal', true);
while (!duel.dead) advance(duel, false);
await new Promise(r =>
  setTimeout(r, Math.max(0, ready.room.startAt - ready.serverNow + (duel.tick / 120) * 1000)),
);
await call('duelTick', {code: room.room.code, ticks: duel.tick, inputs: []}, guest.token);
const final = await call(
  'duelTick',
  {code: room.room.code, ticks: duel.tick, inputs: []},
  guest2.token,
);
assert.equal(final.room.state, 'finished');
assert.equal(final.room.winner, 'draw');
assert.equal(
  (await call('me', {}, guest.token)).profile.runs,
  0,
  'guest duel must not earn persistent account rewards',
);
ws.close();
const recovered = await call('recover', {
  username: name,
  password: pass + 'new',
  recovery: registered.recovery,
});
assert.equal(recovered.status, 200);
assert.equal((await call('me', {}, login.token)).status, 401);
await call('logout', {}, recovered.token);
assert.equal((await call('me', {}, recovered.token)).status, 401);
const cors = await fetch(`${base}/health`, {headers: {Origin: 'https://attacker.example'}});
assert.equal(cors.status, 403);
console.log(
  'PASS: username/password, recovery, session revocation, replay, duplicate settlement, guest 1v1, private rooms, realtime WebSocket, CORS.',
);
