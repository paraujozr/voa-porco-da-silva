import {createRun, advance} from '../core/engine.js';

// Naive autopilot: flaps whenever the pig sinks below the centre of the next gate.
export function autopilot(seed = 19, level = 'easy', {maxTicks = 120 * 120, goal = Infinity} = {}) {
  const run = createRun(seed, level);
  const inputs = [];
  const gates = new Map();
  while (!run.dead && run.tick < maxTicks && run.passed < goal) {
    const target = run.gates.find((g) => g.x > -1)?.center ?? 1;
    const flap = run.y < target - 0.5 && run.v < 0;
    if (flap) inputs.push(run.tick);
    advance(run, flap);
    for (const g of run.gates) if (!gates.has(g.id)) gates.set(g.id, {center: g.center, gap: g.gap});
  }
  return {run, inputs, gates: [...gates.values()]};
}
