import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSave, writeSave} from '../src/config.js';
test('save corrompido não impede a inicialização', () => {
  assert.equal(readSave({getItem: () => '{invalid'}).coins, 0);
  assert.equal(readSave({getItem: () => '{"coins":-50}'}).coins, 0);
});
test('progresso é preservado e falha de armazenamento é tolerada', () => {
  let value;
  const storage = {setItem: (k, v) => (value = v), getItem: () => value};
  const s = {
    coins: 12,
    best: {rio: 5},
    unlocked: ['coroa'],
    maps: ['cipo'],
    muted: true,
    low: false,
  };
  assert.equal(writeSave(storage, s), true);
  assert.deepEqual(readSave(storage), s);
  assert.equal(
    writeSave(
      {
        setItem: () => {
          throw Error('blocked');
        },
      },
      s,
    ),
    false,
  );
});

test('save antigo mantém moedas e skins e começa em Cipó', () => {
  const s = readSave({
    getItem: k =>
      k === 'voaporco-beta-save'
        ? JSON.stringify({coins: 215, unlocked: ['coroa'], best: {rio: 7}})
        : null,
  });
  assert.equal(s.coins, 215);
  assert.equal(s.best.rio, 7);
  assert.deepEqual(s.unlocked, ['coroa']);
  assert.deepEqual(s.maps, ['cipo']);
});
