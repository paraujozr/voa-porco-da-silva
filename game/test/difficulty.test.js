import {speedFor} from '../core/adventure.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS, createRun} from '../core/engine.js';
import {DIFFICULTY_NAMES} from '../src/difficulty.js';
import {autopilot} from './helpers.js';

const order = ['easy', 'normal', 'hard'];

test('cada nível tem nome e dificuldade crescente (velocidade, abertura, espaço, variação)', () => {
  assert.deepEqual(Object.keys(LEVELS).sort(), Object.keys(DIFFICULTY_NAMES).sort());
  for (let i = 1; i < order.length; i++) {
    const a = LEVELS[order[i - 1]],
      b = LEVELS[order[i]];
    assert.ok(a.speed < b.speed, 'velocidade');
    assert.ok(a.gap[1] > b.gap[1] && a.gap[0] > b.gap[0], 'abertura');
    assert.ok(a.space[1] > b.space[1] && a.space[0] > b.space[0], 'espaçamento');
    assert.ok(a.rise < b.rise, 'variação de altura');
  }
});

test('velocidade cresce com tempo, canos e moedas e tem teto por nível', () => {
  for (const [id, d] of Object.entries(LEVELS)) {
    const run = createRun(1, id);
    assert.equal(speedFor(run), d.speed);
    run.tick = 120 * 60;
    const timed = speedFor(run);
    assert.ok(timed > d.speed);
    run.coins = 20;
    const coins = speedFor(run);
    assert.ok(coins > timed);
    run.passed = 20;
    assert.ok(speedFor(run) > coins);
    run.passed = 10000;
    const max = speedFor(run);
    run.passed *= 2;
    assert.equal(speedFor(run), max);
    assert.ok(max <= d.speed * 2.35);
  }
});

test('canos gerados respeitam limites de abertura, altura e variação em todos os níveis', () => {
  for (const [id, d] of Object.entries(LEVELS)) {
    const all = [];
    for (const seed of [3, 47, 91, 1234]) {
      const {gates} = autopilot(seed, id, {maxTicks: 120 * 300});
      all.push(...gates);
      let last = 1;
      for (const g of gates) {
        assert.ok(g.gap >= d.gap[0] && g.gap <= d.gap[1], `${id} gap ${g.gap}`);
        assert.ok(g.center >= -0.7 && g.center <= 2.8, `${id} center ${g.center}`);
        assert.ok(Math.abs(g.center - last) <= d.rise + 0.001, `${id} rise`);
        last = g.center;
      }
    }
    assert.ok(all.length >= 20, `${id}: amostra suficiente`);
    assert.ok(new Set(all.map(g => g.gap.toFixed(2))).size > 15, `${id}: aberturas variam`);
  }
});
