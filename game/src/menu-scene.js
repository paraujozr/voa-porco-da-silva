import * as T from 'three';
import {Voxels, mat, box} from './pig.js';

// The main-menu set piece: one voxel prop per map that the pig sits on.
//
// Props are modelled at the pig's natural size, with the origin on the ground at the centre.
// buildMenuProp() returns:
//   group   THREE.Group to add to the scene (positioned/scaled by the caller)
//   seat    {x, y, z} where the pig's bottom rests, in prop units
//   width / height   footprint, used to fit the scene into the free screen area
//   update(t, dt)    small ambient motion (bunting, umbrella, flag, toucan)
export const MENU_PROP_IDS = ['cipo', 'rio', 'brasilia', 'amazonia'];

export function buildMenuProp(mapId) {
  const build = BUILDERS[mapId];
  if (!build) throw new Error(`Sem objeto de menu para o mapa: ${mapId}`);
  const group = new T.Group();
  const cache = new Map();
  const paint = c => {
    if (!cache.has(c)) cache.set(c, mat(c));
    return cache.get(c);
  };
  const b = (c, x, y, z, w, h, d, r = 0, parent = group) =>
    box(parent, paint(c), x, y, z, w, h, d, r);
  const pivot = (x, y, z, parent = group) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  const motion = [];
  const prop = build({group, b, pivot, motion});
  return {
    group,
    seat: prop.seat,
    width: prop.width,
    height: prop.height,
    update(t) {
      for (const fn of motion) fn(t);
    },
  };
}

const WOOD = [0xb9794a, 0xa86a3d, 0x965c33];
const IRON = 0x2b3a46;

// Cipó Guaçu: park bench with a lamp post and festa junina bunting.
function cipo({b, pivot, motion}) {
  for (let i = 0; i < 3; i++) {
    b(WOOD[i], 0, 0.84, -0.25 + i * 0.3, 2.7, 0.1, 0.26);
    b(WOOD[i], 0, 1.3 + i * 0.27, -0.55, 2.7, 0.2, 0.08);
  }
  for (const x of [-1.2, 1.2]) {
    b(IRON, x, 0.4, -0.3, 0.14, 0.8, 0.12);
    b(IRON, x, 0.4, 0.4, 0.14, 0.8, 0.12);
    b(IRON, x, 1.35, -0.55, 0.12, 1.1, 0.1);
    b(IRON, x * 1.12, 1.05, -0.05, 0.12, 0.08, 0.95);
  }
  b(IRON, 2.4, 1.7, -0.3, 0.12, 3.4, 0.12);
  b(0xf2dc7a, 2.4, 3.45, -0.3, 0.4, 0.3, 0.4);
  const flags = pivot(2.4, 3.05, -0.3);
  const colors = [0xffdf00, 0x009c3b, 0xef7453, 0x47aecb, 0xffdf00, 0x009c3b];
  colors.forEach((c, i) => {
    const flag = pivot(-0.35 - i * 0.38, -Math.sin((i / 5) * Math.PI) * 0.1 - i * 0.1, 0, flags);
    b(c, 0, -0.14, 0, 0.26, 0.28, 0.04, 0, flag);
    motion.push(t => (flag.rotation.z = Math.sin(t * 2.4 + i * 0.7) * 0.25));
  });
  return {seat: {x: 0, y: 0.89, z: -0.1}, width: 5.4, height: 3.7};
}

// Rio de Janeiro: a striped beach chair on the calçadão, with an umbrella, palm, towel and board.
function rio({b, pivot, motion}) {
  const fabric = [0x2f8fd0, 0xfff4d6];
  const metal = 0xaab4bb;
  const wood = 0xb9794a;
  for (let i = 0; i < 5; i++) b(fabric[i % 2], 0, 0.5, -0.4 + i * 0.22, 1.5, 0.07, 0.2);
  // The back leans away from the camera.
  const back = pivot(0, 0.52, -0.5);
  back.rotation.x = -0.5;
  for (let i = 0; i < 6; i++) b(fabric[i % 2], 0, 0.1 + i * 0.22, 0, 1.5, 0.2, 0.06, 0, back);
  for (const x of [-0.85, 0.85]) {
    b(metal, x, 0.25, 0.5, 0.07, 0.5, 0.07);
    b(metal, x, 0.25, -0.5, 0.07, 0.5, 0.07);
    b(metal, x, 0.5, 0, 0.07, 0.06, 1.1);
    const post = pivot(x, 0.52, -0.5);
    post.rotation.x = -0.5;
    b(metal, 0, 0.7, 0, 0.07, 1.4, 0.07, 0, post);
    b(wood, x * 1.12, 0.84, 0.05, 0.1, 0.06, 0.8);
    b(wood, x * 1.12, 0.66, 0.42, 0.07, 0.34, 0.07);
  }
  b(0xffffff, 2.3, 1.45, -0.5, 0.07, 2.9, 0.07);
  const umbrella = pivot(2.3, 2.85, -0.5);
  [
    [0xc93c2c, 1.8],
    [0xfff4d6, 1.4],
    [0xc93c2c, 1.0],
    [0xfff4d6, 0.6],
  ].forEach(([c, w], i) => b(c, 0, 0.06 * i, 0, w, 0.1, w, 0, umbrella));
  motion.push(t => (umbrella.rotation.z = Math.sin(t * 0.9) * 0.05));
  for (let i = 0; i < 4; i++) b(0x7a5a3a, -2.2 - i * 0.04, 0.4 + i * 0.5, -0.4, 0.2, 0.55, 0.2);
  const crown = pivot(-2.4, 2.45, -0.4);
  for (let i = 0; i < 5; i++) {
    const leaf = pivot(0, 0, 0, crown);
    leaf.rotation.z = -1.2 + i * 0.6;
    b(0x2f8f4e, 0, 0.55, 0, 0.22, 1.1, 0.14, 0, leaf);
  }
  motion.push(t => (crown.rotation.z = Math.sin(t * 0.8) * 0.04));
  // A beach towel and a surfboard stuck in the sand.
  for (let i = 0; i < 5; i++)
    b(i % 2 ? 0xfff4d6 : 0xc93c2c, 1.45 + i * 0.2, 0.02, 0.85, 0.2, 0.03, 0.9);
  b(0xe8b35a, -1.55, 0.7, 0.2, 0.28, 1.4, 0.06, -0.2);
  return {seat: {x: 0, y: 0.54, z: 0.05}, width: 6.0, height: 3.7};
}

// Brasília: white stepped ramp up to a dome, with a waving flag.
function brasilia({b, pivot, motion, group}) {
  const white = 0xede4cc;
  const heights = [0.3, 0.5, 0.7, 0.9];
  heights.forEach((h, i) =>
    b(i % 2 ? 0xe2d9c0 : white, -1.4 + i * 0.7 + 0.35, h / 2, 0, 0.7, h, 1.2),
  );
  const dome = new Voxels(0.1);
  dome.ellipsoid(0, 0, 0, 1.3, 1.1, 1.0, white);
  const domeMesh = dome.build();
  domeMesh.position.set(-2.4, 0, -0.1);
  group.add(domeMesh);
  b(0x6598ac, -2.4, 0.62, 0.9, 1.7, 0.12, 0.06);
  b(0xd7cfb8, -2.4, 1.15, -0.1, 0.3, 0.2, 0.3);
  b(white, 1.7, 0.45, -0.2, 0.7, 0.9, 0.8);
  b(white, 0.4, 1.2, -0.65, 0.07, 2.4, 0.07);
  const flag = pivot(0.4, 2.1, -0.65);
  b(0x009c3b, 0.3, 0, 0, 0.6, 0.4, 0.04, 0, flag);
  b(0xffdf00, 0.3, 0, 0.03, 0.34, 0.22, 0.04, Math.PI / 4, flag);
  motion.push(t => (flag.rotation.y = Math.sin(t * 2.6) * 0.35));
  return {seat: {x: 1.05, y: 0.9, z: 0}, width: 6.3, height: 3.6};
}

// A horizontal voxel log: grooved bark, mossy top and pale growth rings on the cut ends.
function barkLog() {
  const size = 0.08,
    length = 3.1,
    radius = 0.54;
  const v = new Voxels(size);
  const half = Math.round(length / 2 / size),
    r = Math.round(radius / size),
    centre = Math.round(0.52 / size);
  const ring = [0xdcb883, 0xc59a63, 0xdcb883, 0xb88a52];
  for (let x = -half; x <= half; x++)
    for (let y = -r; y <= r; y++)
      for (let z = -r; z <= r; z++) {
        const d = Math.hypot(y, z);
        if (d > r) continue;
        const angle = Math.atan2(z, y);
        let color;
        if (Math.abs(x) === half)
          color = d < 1.5 ? 0xa87b45 : ring[Math.min(3, Math.floor((d / r) * 4))];
        else if (d < r - 1.2)
          continue; // hollow: only the outer shell matters
        else {
          const groove = Math.sin(angle * 11 + Math.sin(x * 0.9 + angle * 2) * 2.2) > 0.4;
          const moss = y > r * 0.35 && Math.sin(x * 0.45 + angle * 3) > 0.15;
          color = moss ? (groove ? 0x3f7a3a : 0x4f8a45) : groove ? 0x4a2f1c : 0x6e4a2b;
        }
        v.set(x, y + centre, z, color);
      }
  return v.build();
}

// Amazônia: fallen mossy log with mushrooms and a toucan.
function amazonia({b, pivot, motion}) {
  // Turn the whole set a little so the pale growth rings of the cut end face the camera.
  const set = pivot(0, 0, 0);
  set.rotation.y = 0.55;
  set.add(barkLog());
  for (const [x, z, k] of [
    [1.15, 0.62, 1],
    [1.45, 0.45, 0.7],
  ]) {
    b(0xf2e8d0, x, 0.15 * k, z, 0.1 * k, 0.3 * k, 0.1 * k, 0, set);
    b(0xd13b2f, x, 0.34 * k, z, 0.32 * k, 0.14 * k, 0.32 * k, 0, set);
    b(0xffffff, x, 0.42 * k, z, 0.1 * k, 0.04 * k, 0.1 * k, 0, set);
  }
  const toucan = pivot(-1.0, 1.0, 0.1, set);
  b(0x1d2530, 0, 0.3, 0, 0.36, 0.55, 0.32, 0, toucan);
  b(0xf6f0dc, 0.12, 0.28, 0.02, 0.14, 0.3, 0.3, 0, toucan);
  const head = pivot(0.04, 0.68, 0, toucan);
  b(0x1d2530, 0, 0, 0, 0.3, 0.3, 0.3, 0, head);
  b(0xf49a1f, 0.36, -0.03, 0, 0.5, 0.17, 0.16, 0, head);
  b(0xd9531e, 0.62, -0.07, 0, 0.12, 0.1, 0.12, 0, head);
  b(0xffffff, 0.08, 0.07, 0.15, 0.07, 0.07, 0.03, 0, head);
  motion.push(t => {
    head.rotation.z = Math.sin(t * 1.7) * 0.18;
    head.rotation.y = Math.sin(t * 0.9) * 0.4;
  });
  for (let i = 0; i < 5; i++) {
    const frond = pivot(1.9 + (i % 2) * 0.12, 0, -0.2, set);
    frond.rotation.z = -0.5 - i * 0.28;
    b(0x2f8f4e, 0, 0.5, 0, 0.12, 1.0, 0.1, 0, frond);
  }
  return {seat: {x: 0, y: 1.02, z: 0}, width: 5.2, height: 3.6};
}

const BUILDERS = {cipo, rio, brasilia, amazonia};
