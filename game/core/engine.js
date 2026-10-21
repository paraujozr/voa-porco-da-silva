import {
  STAGES,
  speedFor,
  activePower,
  protectedPower,
  hitRadius,
  effectiveGate,
  activatePower,
} from './adventure.js';
// Gates and coins appear this far (world units) ahead of the pig. Wider than any supported
// screen (21:9 shows ~33 units to the right of the pig), so they never pop in on screen.
export const SPAWN_X = 56;
// Keep a bounded replay budget on the server, without ending normal flights near 300 pipes.
export const SOLO_SECONDS = 60 * 60;
export const DT = 1 / 120,
  MAX_TICKS = 120 * SOLO_SECONDS,
  DUEL_TICKS = 120 * 180,
  CONTINUE_LIMIT = 3;
export const LEVELS = {
  easy: {speed: 4.5, boost: 0.9, gap: [5.8, 6.7], space: [12, 18], rise: 1.4},
  normal: {speed: 5.8, boost: 1.3, gap: [4.8, 5.8], space: [10, 16.5], rise: 2.1},
  hard: {speed: 8.2, boost: 1.5, gap: [3.25, 4.05], space: [9, 13], rise: 2.2},
};
export const continuePrice = n => 25 * 2 ** n;
export function rng(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function createRun(
  seed = 1,
  level = 'normal',
  duel = false,
  {mapId = 'cipo', skinId = 'mandrake', mode = 'endless'} = {},
) {
  if (!Object.hasOwn(LEVELS, level)) throw Error('Dificuldade inválida');
  if (!Object.hasOwn(STAGES, mapId) || !['campaign', 'endless'].includes(mode))
    throw Error('Destino ou modo inválido');
  return {
    seed,
    mapId,
    skinId,
    mode,
    obstacles: [],
    projectiles: [],
    shotSerial: 0,
    powerUntil: 0,
    powerReady: 0,
    level,
    duel,
    tick: 0,
    y: 1,
    v: 5.8,
    distance: 0,
    coins: 0,
    passed: 0,
    gates: [],
    tokens: [],
    remaining: 0, // the first gate spawns right away; it still needs seconds to arrive
    lastCenter: 1,
    lastSpace: 0,
    serial: 0,
    dead: false,
    reason: '',
    continues: 0,
    shield: 0,
    event67: false,
    random: rng(seed),
  };
}
function gate(run) {
  const d = LEVELS[run.level],
    r = run.random;
  let space = d.space[0] + r() * (d.space[1] - d.space[0]);
  if (Math.abs(space - run.lastSpace) < 1.5)
    space = space < (d.space[0] + d.space[1]) / 2 ? d.space[1] : d.space[0];
  const gap = d.gap[0] + r() * (d.gap[1] - d.gap[0]);
  const center = Math.max(-0.7, Math.min(2.8, run.lastCenter + (r() * 2 - 1) * d.rise));
  run.lastCenter = center;
  run.lastSpace = space;
  run.remaining += space;
  const id = ++run.serial;
  run.gates.push({id, x: SPAWN_X, center, gap, passed: false});
  const cadence = run.level === 'hard' ? 3 : run.level === 'normal' ? 5 : 8;
  if (id > 5 && id % cadence === 0) {
    const phase = r() * Math.PI * 2;
    const baseY = Math.max(-1.8, Math.min(4.5, center + (r() < 0.5 ? -1.6 : 1.6)));
    run.obstacles.push({
      id,
      x: SPAWN_X + space * 0.5,
      baseY,
      phase,
      y: baseY + Math.sin((run.tick / 120) * 1.4 + phase) * 0.6,
      kind: STAGES[run.mapId].hazard,
      radius: 0.48,
    });
  }
  for (let i = 0; i < 3; i++)
    run.tokens.push({id: `${id}-${i}`, x: SPAWN_X + 2.4 + i * 0.85, y: center});
}
export function collide(y, g, radius = 0.65) {
  const cx = 0.1,
    cy = y + 0.05,
    r = radius;
  for (const sign of [-1, 1]) {
    const edge = g.center + (sign * g.gap) / 2,
      lo = sign < 0 ? edge - 30 : edge,
      hi = sign < 0 ? edge : edge + 30;
    const nx = Math.max(g.x - 0.96, Math.min(cx, g.x + 0.96)),
      ny = Math.max(lo, Math.min(cy, hi));
    if ((cx - nx) ** 2 + (cy - ny) ** 2 < r * r) return true;
  }
  return false;
}
export function advance(run, flap = false, power = false) {
  if (run.dead) return {dead: true};
  const old = run.passed;
  if (power) activatePower(run);
  if (flap) run.v = 6.8;
  run.v -= 19 * DT;
  run.y += run.v * DT;
  run.tick++;
  const speed = speedFor(run);
  run.distance += speed * DT;
  run.remaining -= speed * DT;
  if (run.remaining <= 0) gate(run);
  if (run.y > 7.6) {
    run.y = 7.6;
    run.v = Math.min(0, run.v);
  }
  run.shield = Math.max(0, run.shield - 1);
  for (const g of run.gates) {
    g.x -= speed * DT;
    if (!g.passed && g.x < -1.6) {
      g.passed = true;
      run.passed++;
    }
  }
  const kind = activePower(run);
  for (const o of run.obstacles) {
    o.x -= speed * DT;
    if (kind === 'web') o.phase -= 1.4 * DT;
    if (kind !== 'web') o.y = o.baseY + Math.sin((run.tick / 120) * 1.4 + o.phase) * 0.6;
  }
  for (const shot of run.projectiles) {
    shot.x += 25 * DT;
    shot.life--;
    for (const g of run.gates)
      if (!g.broken && shot.hits > 0 && Math.abs(g.x - shot.x) < 1.3) {
        g.broken = true;
        shot.hits--;
      }
    for (const o of run.obstacles)
      if (!o.broken && shot.hits > 0 && Math.hypot(o.x - shot.x, o.y - shot.y) < 1.1) {
        o.broken = true;
        shot.hits--;
      }
  }
  if (['smash', 'wave', 'eat'].includes(kind)) {
    for (const g of run.gates) if (Math.abs(g.x) < 3.5) g.broken = true;
    for (const o of run.obstacles) if (Math.abs(o.x) < 4) o.broken = true;
  }
  if (protectedPower(run) && run.y < -2.9) {
    run.y = -2.9;
    run.v = 5.8;
  }
  if (run.y < -3.75) {
    run.dead = true;
    run.reason = 'ground';
  } else if (
    !run.shield &&
    !protectedPower(run) &&
    run.gates.some(g => !g.broken && collide(run.y, effectiveGate(run, g), hitRadius(run)))
  ) {
    run.dead = true;
    run.reason = 'pipe';
  } else if (
    !run.shield &&
    !protectedPower(run) &&
    run.obstacles.some(
      o => !o.broken && Math.hypot(o.x - 0.1, o.y - run.y) < o.radius + hitRadius(run),
    )
  ) {
    run.dead = true;
    run.reason = 'obstacle';
  } else if (run.tick >= (run.duel ? DUEL_TICKS : MAX_TICKS)) {
    run.dead = true;
    run.reason = 'limit';
  }
  for (const c of run.tokens) {
    c.x -= speed * DT;
    if (
      !run.dead &&
      Math.abs(c.x) < (kind === 'magnet' ? 5 : 0.9) &&
      Math.abs(c.y - run.y) < (kind === 'magnet' ? 8 : 1)
    ) {
      c.collected = true;
      run.coins++;
    }
  }
  if (!run.dead && !run.duel && run.mode === 'campaign' && run.passed >= STAGES[run.mapId].goal) {
    run.dead = true;
    run.reason = 'complete';
  }
  run.obstacles = run.obstacles.filter(o => !o.broken && o.x > -25);
  run.projectiles = run.projectiles.filter(p => p.hits > 0 && p.life > 0);
  run.tokens = run.tokens.filter(c => !c.collected && c.x > -25);
  run.gates = run.gates.filter(g => g.x > -25);
  const sixSeven = !run.event67 && old < 67 && run.passed >= 67;
  if (sixSeven) run.event67 = true;
  return {dead: run.dead, sixSeven, speed};
}
export function revive(run) {
  if (
    !run.dead ||
    run.duel ||
    ['limit', 'complete'].includes(run.reason) ||
    run.continues >= CONTINUE_LIMIT
  )
    throw Error('Continue indisponível');
  run.continues++;
  run.dead = false;
  run.reason = '';
  run.y = Math.max(-0.5, Math.min(2, run.gates.find(g => g.x > -1)?.center ?? 1));
  run.v = 5.8;
  run.shield = 180;
  run.obstacles = run.obstacles.filter(o => Math.abs(o.x) > 5);
  run.gates = run.gates.filter(g => Math.abs(g.x) > 3.5);
  run.tokens = run.tokens.filter(c => Math.abs(c.x) > 3.5);
  return run;
}
export function replay({
  seed,
  level,
  duel = false,
  inputs,
  ticks,
  revives = [],
  powers = [],
  mapId = 'cipo',
  skinId = 'mandrake',
  mode = 'endless',
}) {
  if (
    !Number.isInteger(ticks) ||
    ticks < 0 ||
    ticks > (duel ? DUEL_TICKS : MAX_TICKS) ||
    !Array.isArray(inputs) ||
    inputs.length > MAX_TICKS / 2 ||
    !Array.isArray(revives) ||
    revives.length > 3
  )
    throw Error('Replay inválido');
  let prev = -1;
  for (const i of inputs) {
    if (!Number.isInteger(i) || i < 0 || i >= ticks || i <= prev) throw Error('Impulsos inválidos');
    prev = i;
  }
  if (!Array.isArray(powers) || powers.length > 180) throw Error('Poderes inválidos');
  let previousPower = -1;
  for (const t of powers) {
    if (!Number.isInteger(t) || t < 0 || t >= ticks || t <= previousPower)
      throw Error('Poderes inválidos');
    previousPower = t;
  }
  const run = createRun(seed, level, duel, {mapId, skinId, mode});
  let pc = 0;
  let cursor = 0,
    rc = 0;
  while (run.tick < ticks) {
    if (run.dead) {
      if (revives[rc] !== run.tick) throw Error('Voo terminou antes do informado');
      revive(run);
      rc++;
    }
    const usePower = powers[pc] === run.tick;
    if (usePower && run.tick < run.powerReady) throw Error('Poder ainda recarregando');
    advance(run, inputs[cursor] === run.tick, usePower);
    if (usePower) pc++;
    if (inputs[cursor] === run.tick - 1) cursor++;
  }
  if (rc !== revives.filter(t => t < ticks).length) throw Error('Continue inválido');
  return run;
}
export function nickname(value) {
  const n = String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N}_ ]{3,18}$/u.test(n))
    throw Error('Use de 3 a 18 letras, números, espaços ou _ no apelido.');
  return n;
}
export function freshProfile(name = 'Porco Voador') {
  return {
    nickname: name,
    coins: 0,
    totalCoins: 0,
    unlocked: [],
    maps: ['cipo'],
    completed: [],
    best: {},
    ranked: {},
    runs: 0,
    activeRun: null,
  };
}
export function credit(profile, run, alreadyPaid = 0, countRun = true) {
  const coins = Math.max(0, run.coins - alreadyPaid),
    distance = run.passed,
    key = `${run.mapId || 'cipo'}:${run.level}`;
  const completed = [...(profile.completed || [])],
    maps = [...profile.maps];
  if (run.reason === 'complete' && run.mode === 'campaign' && !run.duel) {
    if (!completed.includes(run.mapId)) completed.push(run.mapId);
    const next = STAGES[run.mapId].next;
    if (next && !maps.includes(next)) maps.push(next);
  }
  return {
    ...profile,
    completed,
    maps,
    coins: profile.coins + coins,
    totalCoins: (profile.totalCoins || 0) + coins,
    runs: (profile.runs || 0) + (countRun ? 1 : 0),
    best: {...profile.best, [key]: Math.max(profile.best[key] || 0, distance)},
    ranked: run.continues
      ? {...profile.ranked}
      : {...profile.ranked, [run.level]: Math.max(profile.ranked?.[run.level] || 0, distance)},
  };
}
export function roomResult(room, now) {
  if (room.state !== 'racing') return room;
  const copy = structuredClone(room);
  for (const p of Object.values(copy.players))
    if (p.state === 'racing' && (now - p.lastSeen > 15000 || now > room.startAt + 185000)) {
      p.state = 'done';
      p.forfeit = true;
    }
  const players = Object.entries(copy.players);
  if (players.length === 2 && players.every(([, p]) => p.state === 'done')) {
    copy.state = 'finished';
    const [a, b] = players;
    copy.winner =
      a[1].distance === b[1].distance ? 'draw' : a[1].distance > b[1].distance ? a[0] : b[0];
  }
  return copy;
}
