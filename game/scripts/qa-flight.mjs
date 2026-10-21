import {mkdirSync, writeFileSync} from 'node:fs';
// Optional trajectory search: exercises real controls and collisions, without editing scores.
import {createRun, advance, collide, replay} from '../core/engine.js';
import {speedFor, protectedPower, effectiveGate, hitRadius} from '../core/adventure.js';
function decide(r) {
  const speed = speedFor(r);
  let beam = [{y: r.y, v: r.v, first: false}];
  for (let step = 0; step < 24; step++) {
    const next = [],
      time = (step + 1) * 0.05;
    for (const state of beam)
      for (const flap of [false, true]) {
        let y = state.y,
          v = flap ? 6.8 : state.v,
          ok = true;
        for (let k = 0; k < 6; k++) {
          v -= 19 / 120;
          y += v / 120;
          if (y > 7.6) {
            y = 7.6;
            v = Math.min(0, v);
          }
          const t = step * 0.05 + (k + 1) / 120;
          if (y < -3.65) {
            ok = false;
            break;
          }
          if (!protectedPower(r)) {
            if (
              r.gates.some(
                g =>
                  !g.broken &&
                  collide(y, {...effectiveGate(r, g), x: g.x - speed * t}, hitRadius(r)),
              )
            ) {
              ok = false;
              break;
            }
            if (
              r.obstacles.some(
                o =>
                  Math.hypot(
                    o.x - speed * t - 0.1,
                    o.baseY + Math.sin((r.tick / 120 + t) * 1.4 + o.phase) * 0.6 - y,
                  ) <
                  o.radius + hitRadius(r) + 0.08,
              )
            ) {
              ok = false;
              break;
            }
          }
        }
        if (!ok) continue;
        const gate = r.gates.find(g => !g.broken && g.x - speed * time > -1.6);
        const target = gate?.center ?? 1;
        next.push({
          y,
          v,
          first: step === 0 ? flap : state.first,
          cost: Math.abs(y - target) + Math.abs(v) * 0.055,
        });
      }
    if (!next.length) return beam[0]?.first ?? true;
    next.sort((a, b) => a.cost - b.cost);
    const buckets = new Set();
    beam = [];
    for (const x of next) {
      const key = Math.round(x.y * 5) + ':' + Math.round(x.v * 2);
      if (!buckets.has(key)) {
        buckets.add(key);
        beam.push(x);
      }
      if (beam.length === 16) break;
    }
  }
  return beam[0].first;
}
for (const level of process.argv.includes('--record') ? ['easy'] : ['easy', 'normal', 'hard']) {
  const r = createRun(19, level, false, {mode: 'campaign'}),
    inputs = [];
  let action = false;
  while (!r.dead && r.tick < 120 * 1200) {
    if (r.tick % 6 === 0) action = decide(r);
    else action = false;
    if (action) inputs.push(r.tick);
    advance(r, action);
  }
  const copy = replay({seed: r.seed, level, mode: 'campaign', inputs, ticks: r.tick});
  if (copy.passed !== r.passed || copy.reason !== r.reason) throw Error('Replay divergiu');
  if (process.argv.includes('--record')) {
    mkdirSync(new URL('../test/fixtures/', import.meta.url), {recursive: true});
    writeFileSync(
      new URL('../test/fixtures/cipo-flight.json', import.meta.url),
      JSON.stringify({seed: r.seed, level, mode: 'campaign', inputs, ticks: r.tick}),
    );
  }
  console.log(level, r.passed, r.reason, r.tick, 'replay conferido');
}
