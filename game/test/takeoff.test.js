import {test} from 'node:test';
import assert from 'node:assert/strict';
import {takeoffPose, easeInOut, TAKEOFF_SECONDS} from '../src/takeoff.js';

const from = {x: 0, y: -1.2, z: 4, scale: 2.4, yaw: 0.3};
const to = {x: -7, y: 1, z: 0, scale: 0.68, yaw: 0.2};

test('a decolagem começa no assento e termina na posição de voo', () => {
  assert.deepEqual(takeoffPose(from, to, 0), from);
  const end = takeoffPose(from, to, 1);
  for (const key of Object.keys(to)) assert.ok(Math.abs(end[key] - to[key]) < 1e-9, key);
});

test('o porco avança sem voltar atrás, encolhe e salta acima do trajeto reto', () => {
  let previous = takeoffPose(from, to, 0);
  let peak = -Infinity;
  for (let i = 1; i <= 60; i++) {
    const p = takeoffPose(from, to, i / 60, 2);
    assert.ok(p.x <= previous.x + 1e-9, 'x só diminui (voa para a esquerda)');
    assert.ok(p.scale <= previous.scale + 1e-9, 'escala só diminui');
    for (const v of Object.values(p)) assert.ok(Number.isFinite(v));
    const straight = from.y + (to.y - from.y) * easeInOut(i / 60);
    peak = Math.max(peak, p.y - straight);
    previous = p;
  }
  assert.ok(peak > 1.9 && peak <= 2.0001, 'arco de ~2 unidades: ' + peak);
});

test('progresso fora de 0..1 é limitado e a duração é curta', () => {
  assert.equal(easeInOut(-3), 0);
  assert.equal(easeInOut(7), 1);
  assert.deepEqual(takeoffPose(from, to, 5), takeoffPose(from, to, 1));
  assert.ok(TAKEOFF_SECONDS > 0.3 && TAKEOFF_SECONDS < 1);
});

test('o zoom-out vai do close-up do menu ao enquadramento do jogo, sem passar do alvo', async () => {
  const {viewPose, DEFAULT_VIEW} = await import('../src/takeoff.js');
  const menu = {zoom: 3, x: 0, y: -3.2};
  const start = viewPose(menu, DEFAULT_VIEW, 0);
  assert.ok(Math.abs(start.zoom - menu.zoom) < 1e-9 && start.y === menu.y);
  const end = viewPose(menu, DEFAULT_VIEW, 1);
  assert.ok(Math.abs(end.zoom - 1) < 1e-9 && Math.abs(end.y - DEFAULT_VIEW.y) < 1e-9);
  let previous = Infinity;
  for (let i = 0; i <= 40; i++) {
    const v = viewPose(menu, DEFAULT_VIEW, i / 40);
    assert.ok(v.zoom <= previous + 1e-9 && v.zoom >= 1 - 1e-9, 'zoom só diminui até 1');
    previous = v.zoom;
  }
  // Log-space easing: halfway through the (eased) time the zoom is the geometric mean.
  assert.ok(Math.abs(viewPose(menu, DEFAULT_VIEW, 0.5).zoom - Math.sqrt(3)) < 1e-9);
});
