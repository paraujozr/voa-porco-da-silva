import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MENU_PROP_IDS, buildMenuProp} from '../src/menu-scene.js';
import {MAPS} from '../src/config.js';
import {disposeGroup} from '../src/pig.js';

test('cada mapa tem um objeto de menu', () => {
  assert.deepEqual([...MENU_PROP_IDS].sort(), MAPS.map(m => m.id).sort());
});

test('os objetos constroem, têm assento válido e animam sem NaN', () => {
  for (const id of MENU_PROP_IDS) {
    const prop = buildMenuProp(id);
    assert.ok(prop.group.children.length > 5, id);
    for (const key of ['x', 'y', 'z'])
      assert.ok(Number.isFinite(prop.seat[key]), `${id}.seat.${key}`);
    assert.ok(prop.seat.y > 0.5 && prop.seat.y < 1.5, `${id}: altura do assento plausível`);
    assert.ok(prop.width > 3 && prop.height > 2, id);
    for (let t = 0; t < 10; t += 0.37) prop.update(t);
    prop.group.traverse(o => {
      for (const v of [o.position, o.rotation]) {
        assert.ok(Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z), id);
      }
    });
    disposeGroup(prop.group);
  }
});

test('mapa sem objeto falha com mensagem clara', () => {
  assert.throws(() => buildMenuProp('lua'), /Sem objeto de menu/);
});
