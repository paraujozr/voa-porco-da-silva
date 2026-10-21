import {replay as legacyReplay} from './engine-v1.js';
import {RULES_VERSION} from './adventure.js';
import {randomInt, randomUUID, createHash} from 'node:crypto';
import {
  replay,
  LEVELS,
  continuePrice,
  nickname,
  freshProfile,
  credit,
  roomResult,
} from './engine.js';
import {SKINS, MAPS} from './catalog.js';
export function createHandlers(db, ApiError) {
  const fail = (message, code = 'failed-precondition') => {
    throw new ApiError(code, message);
  };
  const profileRef = uid => db.doc(`profiles/${uid}`),
    runRef = id => db.doc(`runs/${id}`),
    roomRef = code => db.doc(`rooms/${code}`);
  const hash = inputs => createHash('sha256').update(JSON.stringify(inputs)).digest('hex');
  const id = value => {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value))
      fail('Identificador inválido', 'invalid-argument');
    return value;
  };

  function verify(saved, data, now, duel = false) {
    if ((data.ticks * 1000) / 120 > now - saved.startAt + 1500) fail('Tempo de partida inválido.');
    if (saved.ticks && hash(data.inputs.filter(t => t < saved.ticks)) !== saved.logHash)
      fail('O histórico da partida mudou.');
    const powers = data.powers || [];
    if (
      saved.ticks &&
      saved.powerHash &&
      hash(powers.filter(t => t < saved.ticks)) !== saved.powerHash
    )
      fail('O histórico dos poderes mudou.');
    return (saved.rules === RULES_VERSION ? replay : legacyReplay)({
      seed: saved.seed,
      mapId: saved.mapId,
      skinId: saved.skinId,
      mode: saved.mode,
      powers,
      level: saved.level,
      duel,
      inputs: data.inputs,
      ticks: data.ticks,
      revives: saved.revives || [],
    });
  }
  const ensureProfile = async uid => {
    const ref = profileRef(uid);
    return db.runTransaction(async tx => {
      const s = await tx.get(ref);
      if (s.exists) return s.data();
      const p = freshProfile(`Porco ${uid.slice(0, 6)}`);
      tx.create(ref, p);
      return p;
    });
  };
  const setNickname = async (uid, data) => {
    const name = nickname(data.nickname);
    return db.runTransaction(async tx => {
      const ref = profileRef(uid),
        s = await tx.get(ref);
      if (!s.exists) fail('Abra seu perfil primeiro.');
      const p = s.data();
      tx.update(ref, {nickname: name});
      for (const [level, distance] of Object.entries(p.ranked || {}))
        if (distance > 0)
          tx.set(db.doc(`boards/${level}/entries/${uid}`), {nickname: name}, {merge: true});
      return {...p, nickname: name};
    });
  };
  const buyItem = async (uid, data) =>
    db.runTransaction(async tx => {
      if (data.kind === 'map')
        fail('Conclua o mapa anterior na campanha para liberar este destino.');
      const items = data.kind === 'map' ? MAPS : SKINS,
        item = items.find(x => x.id === data.id);
      if (!item) fail('Item inexistente.');
      const ref = profileRef(uid),
        snap = await tx.get(ref);
      if (!snap.exists) fail('Perfil não encontrado.');
      const p = snap.data(),
        key = data.kind === 'map' ? 'maps' : 'unlocked';
      if (!item.cost || p[key].includes(item.id)) return p;
      if (p.coins < item.cost) fail('Moedas insuficientes.');
      p.coins -= item.cost;
      p[key].push(item.id);
      tx.set(ref, p);
      return p;
    });
  const beginRun = async (uid, data) => {
    const now = Date.now(),
      rid = randomUUID(),
      seed = randomInt(0, 0x100000000);
    return db.runTransaction(async tx => {
      const ref = profileRef(uid),
        snap = await tx.get(ref);
      if (!snap.exists) fail('Perfil não encontrado.');
      const p = snap.data(),
        map = MAPS.find(m => m.id === data.mapId),
        skin = SKINS.find(s => s.id === data.skinId);
      if (!map || !skin || !Object.hasOwn(LEVELS, data.level)) fail('Seleção inválida.');
      if ((map.cost && !p.maps.includes(map.id)) || (skin.cost && !p.unlocked.includes(skin.id)))
        fail('Seleção ainda bloqueada.');
      if (now - (p.lastStart || 0) < 1000) fail('Aguarde um instante.', 'resource-exhausted');
      if (data.rules != null && data.rules !== RULES_VERSION)
        fail('Atualize o jogo para começar uma partida.');
      if (data.mode && !['campaign', 'endless'].includes(data.mode)) fail('Modo inválido.');
      const run = {
        rules: data.rules || 1,
        mode: data.mode || 'endless',
        skinId: skin.id,
        powerHash: hash([]),
        uid,
        seed,
        level: data.level,
        mapId: map.id,
        startAt: now,
        state: 'active',
        revives: [],
        ticks: 0,
        logHash: hash([]),
        paidCoins: 0,
        counted: false,
      };
      tx.create(runRef(rid), run);
      tx.update(ref, {activeRun: rid, lastStart: now});
      return {id: rid, ...run, serverNow: now};
    });
  };
  const settleRun = async (uid, data) => {
    const rid = id(data.runId),
      now = Date.now();
    return db.runTransaction(async tx => {
      const rr = runRef(rid),
        pr = profileRef(uid),
        [rs, ps] = await Promise.all([tx.get(rr), tx.get(pr)]);
      if (!rs.exists || rs.data().uid !== uid || !ps.exists) fail('Partida não encontrada.');
      const r = rs.data(),
        p = ps.data();
      if (p.activeRun !== rid) fail('Outra partida foi iniciada nesta conta.');
      if (
        r.state === 'dead' &&
        r.ticks === data.ticks &&
        r.logHash === hash(data.inputs) &&
        (!r.powerHash || r.powerHash === hash(data.powers || []))
      )
        return {profile: p, result: r.result};
      if (r.state !== 'active') fail('Partida encerrada.');
      const sim = verify(r, data, now);
      if (!sim.dead && !data.quit) fail('A partida ainda está em andamento.');
      sim.mapId = r.mapId;
      const next = credit(p, sim, r.paidCoins, !r.counted),
        result = {
          distance: sim.passed,
          coins: sim.coins,
          continued: sim.continues,
          reason: sim.reason || 'quit',
        };
      tx.set(pr, next);
      tx.update(rr, {
        state: 'dead',
        ticks: sim.tick,
        logHash: hash(data.inputs),
        powerHash: hash(data.powers || []),
        paidCoins: sim.coins,
        counted: true,
        result,
      });
      if (!sim.continues && result.distance > (p.ranked?.[sim.level] || 0))
        tx.set(db.doc(`boards/${sim.level}/entries/${uid}`), {
          uid,
          nickname: p.nickname,
          distance: result.distance,
          mapId: r.mapId,
          achievedAt: now,
        });
      return {profile: next, result};
    });
  };
  const continueRun = async (uid, data) =>
    db.runTransaction(async tx => {
      const rid = id(data.runId),
        rr = runRef(rid),
        pr = profileRef(uid),
        [rs, ps] = await Promise.all([tx.get(rr), tx.get(pr)]);
      if (!rs.exists || !ps.exists || rs.data().uid !== uid) fail('Partida não encontrada.');
      const r = rs.data(),
        p = ps.data();
      if (p.activeRun !== rid) fail('Partida antiga.');
      if (r.revives.includes(data.tick)) return {profile: p, revives: r.revives};
      if (
        r.state !== 'dead' ||
        data.tick !== r.ticks ||
        r.revives.length >= 3 ||
        ['limit', 'quit', 'complete'].includes(r.result.reason)
      )
        fail('Continue indisponível.');
      const price = continuePrice(r.revives.length);
      if (p.coins < price) fail('Moedas insuficientes.');
      p.coins -= price;
      const revives = [...r.revives, r.ticks];
      tx.set(pr, p);
      tx.update(rr, {state: 'active', revives});
      return {profile: p, revives};
    });
  const createRoom = async (uid, data = {}) => {
    const now = Date.now();
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = String(randomInt(100000, 1000000)),
        rr = roomRef(code);
      const result = await db.runTransaction(async tx => {
        const [rs, ps] = await Promise.all([tx.get(rr), tx.get(profileRef(uid))]);
        if (rs.exists && rs.data().expiresAt > now) return null;
        if (!ps.exists) fail('Perfil não encontrado.');
        const p = ps.data();
        if (now - (p.lastRoom || 0) < 10000)
          fail('Aguarde alguns segundos para criar outra sala.', 'resource-exhausted');
        const room = {
          code,
          rules: data.rules || 1,
          skinId: 'mandrake',
          mode: 'endless',
          host: uid,
          members: [uid],
          state: 'waiting',
          seed: randomInt(0, 0x100000000),
          level: 'normal',
          mapId: 'cipo',
          expiresAt: now + 600000,
          startAt: 0,
          winner: null,
          players: {
            [uid]: {
              nickname: p.nickname,
              ready: false,
              state: 'waiting',
              distance: 0,
              ticks: 0,
              logHash: hash([]),
              lastSeen: now,
            },
          },
        };
        tx.set(rr, room);
        tx.update(profileRef(uid), {lastRoom: now});
        return room;
      });
      if (result) return {room: result, serverNow: now};
    }
    fail('Não foi possível gerar uma sala. Tente novamente.');
  };
  const joinRoom = async (uid, data) => {
    const code = String(data.code);
    if (!/^\d{6}$/.test(code)) fail('Digite os seis números da sala.');
    const now = Date.now();
    return db.runTransaction(async tx => {
      const rr = roomRef(code),
        pr = profileRef(uid),
        [rs, ps] = await Promise.all([tx.get(rr), tx.get(pr)]);
      if (!ps.exists) fail('Perfil não encontrado.');
      const p = ps.data();
      if (now - (p.lastJoin || 0) < 2000)
        fail('Aguarde antes de tentar outro código.', 'resource-exhausted');
      tx.update(pr, {lastJoin: now});
      if (!rs.exists || rs.data().expiresAt < now)
        return {error: 'Sala não encontrada ou expirada.', serverNow: now};
      const room = rs.data();
      if ((room.rules || 1) !== (data.rules || 1))
        fail('Atualizem o jogo nos dois aparelhos antes de entrar na sala.');
      if (room.members.includes(uid)) return {room, serverNow: now};
      if (room.state !== 'waiting' || room.members.length >= 2)
        return {error: 'Sala cheia ou já iniciada.', serverNow: now};
      room.members.push(uid);
      room.players[uid] = {
        nickname: p.nickname,
        ready: false,
        state: 'waiting',
        distance: 0,
        ticks: 0,
        logHash: hash([]),
        lastSeen: now,
      };
      tx.set(rr, room);
      return {room, serverNow: now};
    });
  };
  const readyRoom = async (uid, data) => {
    const now = Date.now();
    return db.runTransaction(async tx => {
      const ref = roomRef(id(data.code)),
        s = await tx.get(ref);
      if (!s.exists) fail('Sala não encontrada.');
      const r = s.data();
      if (!r.members.includes(uid) || r.expiresAt < now) fail('Sala indisponível.');
      if (r.state !== 'waiting') return {room: r, serverNow: now};
      r.players[uid].ready = true;
      if (r.members.length === 2 && Object.values(r.players).every(p => p.ready)) {
        r.state = 'racing';
        r.startAt = now + 4000;
        for (const p of Object.values(r.players)) {
          p.state = 'racing';
          p.lastSeen = r.startAt;
        }
      }
      tx.set(ref, r);
      return {room: r, serverNow: now};
    });
  };
  async function rewardDuel(tx, room, uid) {
    const player = room.players[uid];
    if (player.state !== 'done' || player.rewarded) return;
    if (uid.startsWith('guest_')) {
      player.rewarded = true;
      return;
    }
    const ref = profileRef(uid),
      snap = await tx.get(ref);
    if (!snap.exists) return;
    const profile = snap.data(),
      next = credit(profile, {
        passed: player.distance,
        coins: player.coins || 0,
        level: room.level,
        mapId: room.mapId,
        continues: 0,
      });
    tx.set(ref, next);
    player.rewarded = true;
    if (player.distance > (profile.ranked?.[room.level] || 0))
      tx.set(db.doc(`boards/${room.level}/entries/${uid}`), {
        uid,
        nickname: profile.nickname,
        distance: player.distance,
        mapId: room.mapId,
        achievedAt: Date.now(),
      });
  }
  const duelTick = async (uid, data) => {
    const now = Date.now();
    return db.runTransaction(async tx => {
      const ref = roomRef(id(data.code)),
        s = await tx.get(ref);
      if (!s.exists) fail('Sala não encontrada.');
      let r = s.data();
      if (!r.members.includes(uid)) fail('Você não está nesta sala.', 'permission-denied');
      r = roomResult(r, now);
      if (r.state !== 'racing') {
        if (r.state === 'finished') {
          await rewardDuel(tx, r, uid);
          tx.set(ref, r);
        }
        return {room: r, serverNow: now};
      }
      const p = r.players[uid];
      if (p.state === 'racing' && data.inputs) {
        if (now < r.startAt) fail('Aguarde a largada.');
        if (now - p.lastSeen < 700 && !data.quit)
          fail('Envio muito frequente.', 'resource-exhausted');
        if (data.ticks < p.ticks) fail('Atualização antiga.');
        const sim = verify(
          {...r, ticks: p.ticks, logHash: p.logHash, powerHash: p.powerHash},
          data,
          now,
          true,
        );
        p.distance = sim.passed;
        p.coins = sim.coins;
        p.ticks = sim.tick;
        p.logHash = hash(data.inputs);
        p.powerHash = hash(data.powers || []);
        p.lastSeen = now;
        if (sim.dead || data.quit) p.state = 'done';
      }
      r = roomResult(r, now);
      await rewardDuel(tx, r, uid);
      tx.set(ref, r);
      return {room: r, serverNow: now};
    });
  };
  const leaveRoom = async (uid, data) => {
    const now = Date.now();
    return db.runTransaction(async tx => {
      const ref = roomRef(id(data.code)),
        s = await tx.get(ref);
      if (!s.exists) return {};
      let r = s.data();
      if (!r.members.includes(uid)) fail('Você não está na sala.');
      if (r.state === 'waiting') {
        r.state = 'cancelled';
      } else if (r.state === 'racing') {
        r.players[uid].state = 'done';
        r.players[uid].forfeit = true;
        r = roomResult(r, now);
        await rewardDuel(tx, r, uid);
      }
      tx.set(ref, r);
      return {room: r, serverNow: now};
    });
  };

  return {
    ensureProfile,
    setNickname,
    buyItem,
    beginRun,
    settleRun,
    continueRun,
    createRoom,
    joinRoom,
    readyRoom,
    duelTick,
    leaveRoom,
  };
}
