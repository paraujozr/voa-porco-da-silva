import * as T from 'three';
import {Voxels} from './pig.js';

export function makeHazard(kind) {
  const g = new T.Group(),
    v = new Voxels(0.1);
  if (kind === 'kite') {
    for (let y = -5; y <= 5; y++)
      v.cube(0, y * 0.1, 0, (6 - Math.abs(y)) * 0.17, 0.1, 0.15, y > 0 ? 0xff667a : 0xffcf42);
    for (let i = 0; i < 5; i++)
      v.cube(Math.sin(i) * 0.13, -0.6 - i * 0.13, 0, 0.12, 0.1, 0.1, 0xffcf42);
  } else if (kind === 'gull') {
    v.ellipsoid(0, 0, 0, 0.45, 0.3, 0.3, 0xf7f1dc);
    v.cube(-0.5, 0.08, 0.05, 0.3, 0.12, 0.18, 0xffb53c);
    v.cube(-0.2, 0.18, 0.29, 0.1, 0.1, 0.06, 0x102636);
    for (const side of [-1, 1]) {
      const wing = new T.Group(),
        w = new Voxels(0.1);
      w.cube(0.12, 0, side * 0.35, 0.55, 0.12, 0.7, 0xe3e9f0);
      w.cube(0.14, 0, side * 0.7, 0.4, 0.1, 0.2, 0x30495d);
      wing.add(w.build());
      g.add(wing);
      (g.userData.wings ||= []).push(wing);
    }
  } else if (kind === 'drone') {
    v.cube(0, 0, 0, 0.7, 0.35, 0.5, 0x35465c);
    v.cube(-0.25, -0.08, 0.3, 0.25, 0.16, 0.12, 0xff5544);
    for (const x of [-0.5, 0.5]) {
      v.cube(x, 0.2, 0, 0.18, 0.18, 0.3, 0x718ba3);
      v.cube(x, 0.35, 0, 0.65, 0.08, 0.2, 0xc4dfde);
    }
  } else {
    for (let i = 0; i < 9; i++)
      v.cube(
        (i - 4) * 0.14,
        Math.sin(i * 0.8) * 0.18,
        0,
        0.25,
        0.3,
        0.3,
        i % 2 ? 0xffad35 : 0xf15e36,
      );
    v.cube(-0.48, 0.1, 0.18, 0.1, 0.1, 0.1, 0xfff6a8);
  }
  g.add(v.build());
  return g;
}

export function makeProjectile(kind) {
  const v = new Voxels(0.08),
    g = new T.Group();
  if (kind === 'cheese') {
    for (let i = 0; i < 5; i++)
      v.cube(i * 0.08 - 0.16, 0, 0, 0.08, 0.16 + i * 0.07, 0.48, 0xffd44b);
    for (const [x, y] of [
      [0.1, 0.08],
      [-0.08, -0.04],
      [0.1, -0.1],
    ])
      v.cube(x, y, 0.25, 0.08, 0.08, 0.04, 0xc88b28);
  } else if (kind === 'laser') v.cube(0, 0, 0, 1.7, 0.13, 0.13, 0x67ffd0);
  else v.ellipsoid(0, 0, 0, 0.3, 0.3, 0.3, kind === 'jam' ? 0xd55f80 : 0xf4f5dd);
  g.add(v.build());
  return g;
}

export function makeMotorbike() {
  const g = new T.Group(),
    v = new Voxels(0.09);
  for (const x of [-0.8, 0.8]) {
    v.ellipsoid(x, -0.9, 0, 0.37, 0.37, 0.19, 0x192d3c);
    v.ellipsoid(x, -0.9, 0.2, 0.19, 0.19, 0.05, 0xb3c5cd);
  }
  v.cube(0, -0.6, 0, 1.25, 0.4, 0.5, 0xff7040);
  v.cube(-0.25, -0.34, 0, 0.85, 0.17, 0.55, 0x243444);
  v.cube(0.72, -0.45, 0, 0.17, 0.9, 0.16, 0xb8d5d7);
  v.cube(0.72, 0.02, 0, 0.18, 0.12, 0.8, 0x192d3c);
  v.cube(0.9, -0.28, 0, 0.17, 0.3, 0.4, 0xffe7a0);
  v.cube(-0.9, -0.26, 0, 0.55, 0.65, 0.64, 0xf5ab38);
  g.add(v.build());
  return g;
}
