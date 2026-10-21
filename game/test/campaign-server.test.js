import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHandlers} from '../core/handlers.js';

test('servidor valida voo completo e libera Rio sem confiar em pontuação enviada', async () => {
  const docs = new Map();
  const db = {
    doc: path => path,
    runTransaction: async f =>
      f({
        get: async ref => ({exists: docs.has(ref), data: () => structuredClone(docs.get(ref))}),
        create: (ref, value) => docs.set(ref, structuredClone(value)),
        set: (ref, value, options) =>
          docs.set(ref, structuredClone(options?.merge ? {...docs.get(ref), ...value} : value)),
        update: (ref, value) => docs.set(ref, {...docs.get(ref), ...structuredClone(value)}),
      }),
  };
  class ApiError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  const api = createHandlers(db, ApiError),
    uid = 'test_campaign';
  await api.ensureProfile(uid);
  await assert.rejects(
    api.beginRun(uid, {
      rules: 2,
      mapId: 'rio',
      skinId: 'mandrake',
      level: 'easy',
      mode: 'campaign',
    }),
    /bloqueada/,
  );
  const flight = JSON.parse(
    readFileSync(new URL('./fixtures/cipo-flight.json', import.meta.url), 'utf8'),
  );
  const ticket = await api.beginRun(uid, {
    rules: 2,
    mapId: 'cipo',
    skinId: 'mandrake',
    level: 'easy',
    mode: 'campaign',
  });
  // The fixture replaces the server's random seed and clock in this isolated in-memory test only.
  Object.assign(docs.get('runs/' + ticket.id), {seed: flight.seed, startAt: Date.now() - 210000});
  const payload = {
    runId: ticket.id,
    inputs: flight.inputs,
    ticks: flight.ticks,
    powers: [],
    passed: 99999,
    coins: 99999,
  };
  const result = await api.settleRun(uid, payload);
  assert.equal(result.result.reason, 'complete');
  assert.equal(result.result.distance, 80);
  assert.ok(result.profile.coins < 300);
  assert.deepEqual(result.profile.maps, ['cipo', 'rio']);
  assert.deepEqual(result.profile.completed, ['cipo']);
  assert.deepEqual((await api.settleRun(uid, payload)).profile, result.profile);
  await assert.rejects(
    api.continueRun(uid, {runId: ticket.id, tick: flight.ticks}),
    /indisponível/,
  );
  await assert.rejects(api.buyItem(uid, {kind: 'map', id: 'brasilia'}), /Conclua/);
});
