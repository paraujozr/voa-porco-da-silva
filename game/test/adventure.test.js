import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, advance, replay, revive, credit, freshProfile} from '../core/engine.js';
import {POWERS, STAGES, activatePower, speedFor, effectiveGate} from '../core/adventure.js';
import {PIGS} from '../src/config.js';
import {loadGuestProfile, saveGuestProfile} from '../src/guest-profile.js';

test('todas as skins têm poder e replay reproduz ativações válidas', () => {
  assert.deepEqual(Object.keys(POWERS).sort(), PIGS.map(p => p.id).sort());
  for (const skinId of Object.keys(POWERS)) {
    const r = createRun(19, 'easy', false, {skinId}),
      inputs = [],
      powers = [0];
    while (!r.dead && r.tick < 600) {
      const flap = r.y < 0.5 && r.v < 0;
      if (flap) inputs.push(r.tick);
      advance(r, flap, r.tick === 0);
    }
    const result = replay({seed: 19, level: 'easy', skinId, inputs, powers, ticks: r.tick});
    for (const key of ['passed', 'y', 'coins', 'powerReady', 'powerUntil', 'distance', 'dead'])
      assert.equal(result[key], r[key], `${skinId}: ${key}`);
  }
});
test('recarga impede spam, repetição, poderes retroativos e entradas inválidas', () => {
  assert.throws(
    () => replay({seed: 1, level: 'normal', inputs: [], powers: [0, 1], ticks: 2}),
    /recarregando/,
  );
  for (const powers of [[0, 0], [-1], [1.2], [10], null])
    assert.throws(() => replay({seed: 1, level: 'normal', inputs: [], powers, ticks: 10}));
  const r = createRun();
  assert.equal(activatePower(r), true);
  assert.equal(activatePower(r), false);
  r.tick = r.powerReady;
  assert.equal(activatePower(r), true);
});
test('queijo destrói canos à frente; moto acelera e protege sem gerar moedas extras', () => {
  const cheese = createRun(1, 'normal', false, {skinId: 'queijo'});
  cheese.gates.push({id: 88, x: 1.7, center: 0, gap: 3, passed: false});
  advance(cheese, false, true);
  assert.equal(cheese.gates[0].broken, true);
  assert.equal(cheese.coins, 0);
  const bike = createRun(1, 'hard', false, {skinId: 'delivery'});
  bike.gates.push({id: 88, x: 0, center: -1, gap: 2, passed: false});
  const speed = speedFor(bike);
  advance(bike, false, true);
  assert.ok(speedFor(bike) >= speed * 2);
  assert.equal(bike.dead, false);
  bike.tick = bike.powerUntil;
  advance(bike);
  assert.equal(bike.reason, 'pipe', 'proteção expira');
});
test('abertura visual usa exatamente a abertura validada pelo servidor', () => {
  const r = createRun(1, 'normal', false, {skinId: 'spiderham'});
  const gate = {center: 1, gap: 4};
  assert.equal(effectiveGate(r, gate).gap, 4);
  activatePower(r);
  assert.equal(effectiveGate(r, gate).gap, 6.2);
  assert.equal(gate.gap, 4);
});
test('conclusão libera próximo mapa, preserva compras e sobrevive a recarregar', () => {
  let profile = {...freshProfile(), maps: ['cipo', 'amazonia']};
  for (const [mapId, stage] of Object.entries(STAGES)) {
    const r = createRun(1, 'easy', false, {mapId, mode: 'campaign'});
    r.passed = stage.goal - 1;
    r.gates.push({id: 88, x: -1.59, center: 1, gap: 6, passed: false});
    advance(r);
    assert.equal(r.reason, 'complete');
    assert.throws(() => revive(r), /indisponível/);
    profile = credit(profile, r);
    assert.ok(profile.completed.includes(mapId));
    if (stage.next) assert.ok(profile.maps.includes(stage.next));
  }
  assert.ok(profile.maps.includes('amazonia'));
  const data = new Map(),
    storage = {getItem: k => data.get(k), setItem: (k, v) => data.set(k, v)};
  saveGuestProfile(storage, profile);
  assert.deepEqual(loadGuestProfile(storage).completed, profile.completed);
});
test('voo livre não encerra na meta nem libera mapa; 300 canos não encerram voo', () => {
  const r = createRun();
  r.passed = 300;
  r.tick = 72000;
  advance(r);
  assert.equal(r.dead, false);
  assert.deepEqual(credit(freshProfile(), r).maps, ['cipo']);
});
test('inimigos variam por mapa e têm colisão real', () => {
  for (const [mapId, stage] of Object.entries(STAGES)) {
    const r = createRun(19, 'hard', false, {mapId});
    r.serial = 5;
    advance(r);
    assert.equal(r.obstacles[0].kind, stage.hazard);
    r.obstacles[0].x = 0;
    r.obstacles[0].baseY = r.y;
    advance(r);
    assert.equal(r.reason, 'obstacle');
  }
});
