import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PIGS} from '../src/config.js';
import {makePig, disposeGroup} from '../src/pig.js';
test('todos os modelos têm geometria válida e duas asas animáveis', () => {
  for (const data of PIGS) {
    const pig = makePig(data);
    assert.equal(pig.userData.wings.length, 2, data.id);
    let faces = 0;
    pig.traverse(o => {
      if (!o.geometry) return;
      const positions = o.geometry.getAttribute('position');
      assert.ok(positions.count > 0, data.id);
      for (const n of positions.array) assert.ok(Number.isFinite(n), data.id);
      faces += positions.count;
    });
    assert.ok(faces > 1000, data.id);
    disposeGroup(pig);
  }
});

test('Delivery preserva id e tem capacete com viseira e articulações', () => {
  const p = makePig(PIGS.find(p => p.id === 'delivery'));
  assert.ok(p.getObjectByName('capacete-moto'));
  assert.ok(p.getObjectByName('viseira'));
  assert.equal(p.userData.dog, true);
  assert.ok(p.userData.head && p.userData.body && p.userData.tail);
  disposeGroup(p);
});
