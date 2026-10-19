import {test, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {CloudTransport} from '../src/transport.js';

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));
const storage = (token = '') => ({getItem: () => token, setItem() {}});
const reply = (status, body) => async () => ({
  ok: status < 400,
  status,
  json: async () => {
    if (body === undefined) throw Error('não é json');
    return body;
  },
});

test('chamada envia JSON, o token de sessão e devolve o resultado', async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = {url, init};
    return reply(200, {ok: 1})();
  };
  const t = new CloudTransport('https://srv.example/', storage('abc'), () => {});
  assert.deepEqual(await t.call('me', {a: 1}), {ok: 1});
  assert.equal(seen.url, 'https://srv.example/me');
  assert.equal(seen.init.headers.Authorization, 'Bearer abc');
  assert.equal(seen.init.body, '{"a":1}');
  await t.call('login', {}, false);
  assert.equal(seen.init.headers.Authorization, undefined);
});

test('erros do servidor preservam mensagem e código', async () => {
  globalThis.fetch = reply(401, {error: 'Sessão expirada.', code: 'unauthenticated'});
  const t = new CloudTransport('https://srv.example', storage('x'), () => {});
  await assert.rejects(
    t.call('me'),
    e => e.message === 'Sessão expirada.' && e.code === 'unauthenticated',
  );
});

test('falhas de rede e respostas inválidas viram mensagens em português', async () => {
  const t = new CloudTransport('https://srv.example', storage(), () => {});
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(t.call('me'), /Sem conexão com o servidor/);
  globalThis.fetch = reply(502, undefined);
  await assert.rejects(t.call('me'), /temporariamente indisponível/);
});

test('sem URL configurada nenhuma requisição é feita', async () => {
  globalThis.fetch = async () => assert.fail('não deveria chamar a rede');
  const t = new CloudTransport('', storage(), () => {});
  await assert.rejects(t.call('me'), /não publicado/);
});
