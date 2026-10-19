import {MathUtils as M} from 'three';
// Integrate wing phase instead of multiplying time by a changing speed: no pose jumps.
export function animatePig(pig, {time, dt, state, velocity = 0, pulse = 0, dance = 0}) {
  const u = pig.userData,
    a = (u.motion ||= {phase: 0, rate: 8, energy: 0}),
    flying = state === 'playing',
    hit = state === 'over';
  const falling = flying ? M.clamp((-velocity - 1) / 9, 0, 1) : 0;
  a.rate = M.damp(a.rate, hit ? 2 : 8 + Math.max(0, pulse) * 10 - falling * 3, 6, dt);
  a.energy = M.damp(a.energy, pulse, 12, dt);
  a.phase += a.rate * dt;
  const beat = Math.sin(a.phase),
    lift = Math.sin(a.phase - 0.6),
    strength = hit ? 0.1 : 0.38 + a.energy * 0.45;
  u.wings.forEach((wing, i) => {
    const side = i ? 1 : -1;
    wing.rotation.z = M.damp(
      wing.rotation.z,
      side * (hit ? 0.6 : beat * strength + 0.12 * falling),
      16,
      dt,
    );
    wing.rotation.x = M.damp(
      wing.rotation.x,
      0.12 + Math.cos(a.phase + 0.3) * strength * 0.45,
      12,
      dt,
    );
    wing.rotation.y = M.damp(
      wing.rotation.y,
      side * (0.16 + Math.sin(a.phase - 0.5) * 0.15),
      10,
      dt,
    );
  });
  if (u.body) {
    u.body.position.y = M.damp(
      u.body.position.y,
      -0.25 + (hit ? 0 : lift * 0.035 + a.energy * 0.035),
      12,
      dt,
    );
    u.body.rotation.x = M.damp(
      u.body.rotation.x,
      hit ? 0.16 : -0.08 - a.energy * 0.12 + falling * 0.13,
      8,
      dt,
    );
    u.body.scale.y = M.damp(
      u.body.scale.y,
      1 + a.energy * 0.035 - Math.cos(a.phase) * 0.012,
      10,
      dt,
    );
  }
  if (u.head) {
    u.head.position.y = M.damp(
      u.head.position.y,
      0.82 + (hit ? -0.08 : Math.sin(a.phase - 0.9) * 0.045),
      10,
      dt,
    );
    u.head.rotation.z = M.damp(
      u.head.rotation.z,
      hit ? 0.2 : -velocity * 0.012 + Math.sin(time * 2) * 0.025,
      6,
      dt,
    );
    u.head.rotation.x = M.damp(u.head.rotation.x, falling * 0.12 - a.energy * 0.08, 8, dt);
  }
  u.ears?.forEach((ear, i) => {
    const side = i ? 1 : -1;
    ear.rotation.z = M.damp(
      ear.rotation.z,
      (u.dog ? side * 2.4 : -side * 0.25) + Math.sin(a.phase - 1 + i * 0.2) * 0.08,
      8,
      dt,
    );
    ear.rotation.x = M.damp(
      ear.rotation.x,
      -a.energy * 0.2 + falling * 0.3 + Math.sin(a.phase - 1.4) * 0.07,
      8,
      dt,
    );
  });
  u.limbs?.forEach((limb, i) => {
    const arm = i === 1 || i === 3,
      side = i < 2 ? -1 : 1;
    const wave = Math.sin(a.phase - 1 + (arm ? 0 : 0.8) + i * 0.35);
    const target =
      dance && arm
        ? side * (1.1 + Math.sin(time * 10 + (i === 1 ? 0 : Math.PI)) * 0.65)
        : side * ((arm ? 0.2 : 0.12) + (arm ? 0.12 : 0.06) * wave + falling * (arm ? 0.3 : 0.1));
    limb.rotation.z = M.damp(limb.rotation.z, target, 9, dt);
    limb.rotation.x = M.damp(
      limb.rotation.x,
      hit
        ? -0.5
        : (arm ? -0.12 : 0.15) + wave * (arm ? 0.16 : 0.25) - a.energy * (arm ? 0.28 : 0.45),
      7,
      dt,
    );
  });
  if (u.tail) u.tail.rotation.x = M.damp(u.tail.rotation.x, Math.sin(a.phase - 1.8) * 0.3, 8, dt);
  if (flying) {
    pig.rotation.z = M.damp(
      pig.rotation.z,
      M.clamp(velocity * 0.055, -0.55, 0.34) +
        (dance ? Math.sin(time * 10) * 0.1 : Math.sin(a.phase - 0.4) * 0.025),
      5,
      dt,
    );
    pig.rotation.y = M.damp(pig.rotation.y, 0.24 + Math.sin(a.phase * 0.5) * 0.06, 6, dt);
  }
  if (hit) pig.rotation.z = M.damp(pig.rotation.z, -1.15, 4, dt);
}
