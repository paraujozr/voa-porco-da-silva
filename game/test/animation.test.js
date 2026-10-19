import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makePig, disposeGroup} from '../src/pig.js';
import {PIGS} from '../src/config.js';
import {animatePig} from '../src/animation.js';
test('animação mantém continuidade ao alternar impulso, queda e colisão', () => {
  const pig = makePig(PIGS[0]);
  let previous = 0,
    maxJump = 0;
  for (let i = 0; i < 240; i++) {
    animatePig(pig, {
      time: i / 60,
      dt: 1 / 60,
      state: i < 210 ? 'playing' : 'over',
      velocity: i % 60 < 30 ? 6 : -9,
      pulse: i % 60 === 0 ? 1 : 0,
    });
    const angle = pig.userData.wings[0].rotation.z;
    maxJump = Math.max(maxJump, Math.abs(angle - previous));
    previous = angle;
    pig.traverse(o => {
      for (const v of [
        ...o.position.toArray(),
        o.rotation.x,
        o.rotation.y,
        o.rotation.z,
        ...o.scale.toArray(),
      ])
        assert.ok(Number.isFinite(v));
    });
  }
  assert.ok(maxJump < 0.25, 'asas não devem saltar de pose');
  assert.ok(pig.rotation.z < -0.5, 'colisão deve ter uma pose distinta');
  disposeGroup(pig);
});

test('pose sentada: pernas à frente, sem saltos, e volta suave ao voo', () => {
  const pig = makePig(PIGS[0]);
  const legs = pig.userData.limbs.filter((_, i) => i % 2 === 0);
  let previous = legs[0].rotation.x,
    maxJump = 0;
  const step = (i, sit, state) => {
    animatePig(pig, {time: i / 60, dt: 1 / 60, state, velocity: 0, pulse: 0, sit});
    maxJump = Math.max(maxJump, Math.abs(legs[0].rotation.x - previous));
    previous = legs[0].rotation.x;
  };
  for (let i = 0; i < 180; i++) step(i, 1, 'menu');
  for (const leg of legs) assert.ok(leg.rotation.x < -0.8, 'pernas à frente quando sentado');
  assert.ok(maxJump < 0.15, 'sentar não pode dar saltos de pose: ' + maxJump);
  maxJump = 0;
  for (let i = 180; i < 420; i++) step(i, 0, 'playing');
  for (const leg of legs) assert.ok(leg.rotation.x > -0.5, 'pernas voltam à pose de voo');
  assert.ok(maxJump < 0.15, 'levantar não pode dar saltos de pose: ' + maxJump);
  disposeGroup(pig);
});
