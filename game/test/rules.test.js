import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collide, createRun, advance, replay} from '../core/engine.js';
import {MAPS as CLIENT_MAPS, PIGS} from '../src/config.js';
import {MAPS, SKINS} from '../core/catalog.js';
import {autopilot} from './helpers.js';

test('colisão exige sobreposição horizontal e vertical', () => {
  const g = {x: 0, center: 1, gap: 5.3};
  assert.equal(collide(1, g), false);
  assert.equal(collide(4, g), true);
  assert.equal(collide(4, {...g, x: 4}), false);
});

test('impulso e gravidade são determinísticos: mesma entrada, mesmo resultado', () => {
  const a = createRun(7),
    b = createRun(7);
  for (let i = 0; i < 600; i++) {
    advance(a, i % 50 === 0);
    advance(b, i % 50 === 0);
  }
  assert.equal(a.y, b.y);
  assert.equal(a.v, b.v);
  assert.equal(a.dead, b.dead);
});

test('replay do servidor reproduz um voo longo gerado pelo cliente', () => {
  const {run, inputs} = autopilot(5, 'easy', {maxTicks: 120 * 200});
  const copy = replay({seed: run.seed, level: run.level, inputs, ticks: run.tick});
  for (const key of ['passed', 'coins', 'y', 'dead', 'distance']) assert.equal(copy[key], run[key]);
});

test('catálogo do servidor e config do cliente concordam em ids e preços', () => {
  assert.deepEqual(
    PIGS.map(p => [p.id, p.cost]),
    SKINS.map(s => [s.id, s.cost]),
  );
  assert.deepEqual(
    CLIENT_MAPS.map(m => [m.id, m.cost]),
    MAPS.map(m => [m.id, m.cost]),
  );
  assert.equal(PIGS.length, 21);
  assert.equal(new Set(PIGS.map(p => p.id)).size, 21);
  assert.ok(
    PIGS.slice(0, 4).every(p => p.cost === 0),
    'quatro skins iniciais gratuitas',
  );
});
