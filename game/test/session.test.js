import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {loadGuestProfile, saveGuestProfile} from '../src/guest-profile.js';
import {MAPS, PIGS} from '../src/config.js';
import {createRun} from '../core/engine.js';

function memoryStorage(initial = {}) {
  const data = {...initial};
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => (data[k] = String(v)),
    data,
  };
}
const withProgress = (coins, extra = {}) =>
  memoryStorage({'voaporco-beta-save': JSON.stringify({coins, ...extra})});

test('perfil de convidado novo começa vazio, em Cipó e com apelido padrão', () => {
  const p = loadGuestProfile(memoryStorage());
  assert.equal(p.nickname, 'Porco Visitante');
  assert.equal(p.coins, 0);
  assert.deepEqual(p.maps, ['cipo']);
  assert.deepEqual(p.best, {});
});

test('recordes antigos (só por mapa) migram para a dificuldade normal', () => {
  const p = loadGuestProfile(withProgress(5, {best: {rio: 12, 'cipo:hard': 3}}));
  assert.deepEqual(p.best, {'rio:normal': 12, 'cipo:hard': 3});
  assert.deepEqual(p.legacyBest, {rio: 12, 'cipo:hard': 3});
  assert.equal(p.totalCoins, 5);
});

test('perfil do formato anterior mantém apelido e totais; chave nova tem prioridade', () => {
  const old = memoryStorage({
    'voaporco-guest-profile': JSON.stringify({nickname: 'Zé Antigo', runs: 4}),
  });
  const p = loadGuestProfile(old);
  assert.equal(p.nickname, 'Zé Antigo');
  assert.equal(p.runs, 4);
  const both = memoryStorage({
    'voaporco-guest-profile': JSON.stringify({nickname: 'Zé Antigo'}),
    'voaporco-guest-profile-canos': JSON.stringify({nickname: 'Zé Novo', best: {'rio:easy': 9}}),
  });
  const q = loadGuestProfile(both);
  assert.equal(q.nickname, 'Zé Novo');
  assert.deepEqual(q.best, {'rio:easy': 9});
});

test('armazenamento corrompido ou bloqueado não derruba o perfil de convidado', () => {
  const broken = memoryStorage({'voaporco-guest-profile-canos': '{nope'});
  assert.equal(loadGuestProfile(broken).nickname, 'Porco Visitante');
  const profile = loadGuestProfile(memoryStorage());
  const full = {
    getItem: () => null,
    setItem: () => {
      throw Error('cheio');
    },
  };
  assert.doesNotThrow(() => saveGuestProfile(full, profile));
});

test('perfil de convidado sobrevive a salvar e recarregar', () => {
  const storage = memoryStorage();
  const profile = {
    ...loadGuestProfile(storage),
    nickname: 'Rei do Voo',
    coins: 33,
    runs: 2,
    best: {'cipo:normal': 40},
  };
  saveGuestProfile(storage, profile);
  const again = loadGuestProfile(storage);
  assert.equal(again.nickname, 'Rei do Voo');
  assert.equal(again.coins, 33);
  assert.equal(again.runs, 2);
  assert.deepEqual(again.best, {'cipo:normal': 40});
});

test('mapas exigem campanha; compra de skin é idempotente e respeita saldo', async () => {
  const s = new Session(withProgress(10));
  await assert.rejects(s.buy(MAPS[1], 'map'), /Conclua/);
  assert.equal(s.data.coins, 10);
  assert.deepEqual(s.data.maps, ['cipo']);
  await s.buy(PIGS[4], 'skin');
  await s.buy(PIGS[4], 'skin');
  assert.equal(s.data.coins, 0);
  await assert.rejects(s.buy(PIGS[5], 'skin'), /Moedas insuficientes/);
});

test('convidado recebe um bilhete de voo local com semente e mapa', async () => {
  const s = new Session(memoryStorage());
  const ticket = await s.begin('rio', 'obra', 'hard');
  assert.equal(ticket.level, 'hard');
  assert.equal(ticket.mapId, 'rio');
  assert.ok(Number.isInteger(ticket.seed) && ticket.id);
});

test('convidado: encerrar o mesmo voo duas vezes não duplica moedas nem partidas', async () => {
  const s = new Session(memoryStorage());
  const ticket = await s.begin('cipo', 'obra', 'normal');
  const run = {...createRun(ticket.seed, 'normal'), coins: 7, passed: 12, tick: 500, continues: 0};
  await s.settle(ticket, run, []);
  assert.equal(s.data.coins, 7);
  assert.equal(s.data.runs, 1);
  await s.settle(ticket, run, []);
  assert.equal(s.data.coins, 7);
  assert.equal(s.data.runs, 1);
  assert.equal(s.data.best['cipo:normal'], 12);
  const after = {...run, coins: 10, passed: 15, tick: 900};
  await s.settle(ticket, after, []);
  assert.equal(s.data.coins, 10, 'apenas a diferença é paga');
  assert.equal(s.data.runs, 1, 'continue não conta outra partida');
});

test('convidado paga continue em moedas crescentes e não fica negativo', async () => {
  const s = new Session(withProgress(30));
  const ticket = await s.begin('cipo', 'obra', 'normal');
  await s.continue(ticket, {continues: 0});
  assert.equal(s.data.coins, 5);
  await assert.rejects(s.continue(ticket, {continues: 1}), /Moedas insuficientes/);
  assert.equal(s.data.coins, 5);
});

test('sem servidor configurado, ações online avisam e o jogo solo continua', async () => {
  const s = new Session(memoryStorage());
  assert.equal(s.configured, false);
  await assert.rejects(s.call('createRoom'), /Servidor online ainda não publicado/);
  await assert.rejects(
    s.login('alguem', 'senha-bem-longa-123'),
    /Servidor online ainda não publicado/,
  );
});
