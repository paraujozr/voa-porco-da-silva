import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword, checkPassword, username, password, digest, ApiError} from '../online/auth.js';

// Accounts created while the worker used @noble/hashes' scrypt must keep logging in.
// This vector was produced by that implementation (N=32768, r=8, p=3, 32-byte key).
const LEGACY = {
  password: 'senha-de-teste-12',
  salt: '00112233445566778899aabbccddeeff',
  hash: 'e06c045301390907c05c9add4790d860d84a7a4fa23f0f59a4c7dd8c1274d634',
};

test('hash de senha é compatível com contas já criadas', async () => {
  const saved = {salt: LEGACY.salt, hash: LEGACY.hash};
  assert.equal(await checkPassword(LEGACY.password, saved), true);
  assert.equal(await checkPassword('senha-errada-1234', saved), false);
});

test('hashPassword gera salt aleatório e identifica o algoritmo', async () => {
  const a = await hashPassword(LEGACY.password);
  const b = await hashPassword(LEGACY.password);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(a.algorithm, 'scrypt-32768-8-3');
});

test('validadores de usuário e senha', () => {
  assert.equal(username('Ze_Porco1'), 'ze_porco1');
  for (const bad of ['ab', 'tem espaço', 'x'.repeat(19), 'açúcar', null, 7])
    assert.throws(() => username(bad), ApiError);
  assert.equal(password('doze-chars-ok'), 'doze-chars-ok');
  for (const bad of ['curta', 'x'.repeat(129), null, 123456789012])
    assert.throws(() => password(bad), ApiError);
});

test('digest é SHA-256 em hexadecimal', () => {
  assert.equal(digest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
