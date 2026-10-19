// The ~0.6 s hop from the menu seat to the in-flight position. Pure maths, so it can be tested
// without a renderer; Game.tickTakeoff applies the result to the pig.
export const TAKEOFF_SECONDS = 0.6;

export const clamp01 = t => Math.min(1, Math.max(0, t));
export const easeInOut = t => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};
const lerp = (a, b, k) => a + (b - a) * k;

// Pose of the pig `t` seconds-fraction (0..1) into the takeoff: it eases from `from` to `to`
// and hops over an arc of `hop` units in between. Poses are {x, y, z, scale, yaw}.
export function takeoffPose(from, to, t, hop = 2) {
  const k = easeInOut(t);
  return {
    x: lerp(from.x, to.x, k),
    y: lerp(from.y, to.y, k) + hop * 4 * k * (1 - k),
    z: lerp(from.z, to.z, k),
    scale: lerp(from.scale, to.scale, k),
    yaw: lerp(from.yaw, to.yaw, k),
  };
}
