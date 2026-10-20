import * as T from 'three';
import {Voxels, mat, box, mesh, label} from './pig.js';
export function detailedTree(parent, x, z, h = 5, type = 'leaf') {
  const g = new T.Group();
  g.position.set(x, -4.8, z);
  parent.add(g);
  const v = new Voxels(0.22);
  v.cube(0, h * 0.38, 0, 0.45, h * 0.76, 0.45, 0x76513b);
  v.cube(0.12, h * 0.3, 0.23, 0.12, h * 0.55, 0.08, 0xa87a4d);
  if (type === 'palm') {
    for (let j = 0; j < 5; j++)
      v.cube(Math.sin(j * 0.4) * 0.12, j * h * 0.14, 0, 0.5, 0.12, 0.5, 0xb4915a);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      for (let j = 0; j < 7; j++) {
        const d = j * 0.33,
          y = h * 0.85 + Math.sin(j * 0.6) * 0.45 - j * 0.09;
        v.cube(
          Math.cos(a) * d,
          y,
          Math.sin(a) * d,
          0.65 - j * 0.045,
          0.19,
          0.65 - j * 0.045,
          j % 2 ? 0x448247 : 0x68ad53,
        );
      }
    }
  } else {
    for (const [dx, dy, dz, s, c] of [
      [0, 0.85, 0, 1.2, 0x356b43],
      [-0.7, 0.92, 0.1, 1, 0x448b4c],
      [0.7, 0.95, -0.1, 1.1, 0x4c9450],
      [0, 1.12, 0, 1.1, 0x6da951],
      [0.6, 1.08, 0.55, 0.72, 0x8ab95b],
    ])
      v.ellipsoid(dx, h * dy, dz, s, s * 0.83, s, c);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      v.cube(Math.cos(a) * 1.1, h * 0.94 + Math.sin(a) * 0.5, 0.82, 0.16, 0.2, 0.16, 0xe4b75b);
    }
  }
  g.add(v.build());
  return g;
}
export function detailedHouse(parent, x, z, i) {
  const g = new T.Group();
  g.position.set(x, -4.8, z);
  parent.add(g);
  const colors = [0xec956a, 0xebc353, 0x46a2ae, 0x9c87be, 0xe8d9b7, 0xdd6e71];
  const cache = new Map();
  const m = c => {
    if (!cache.has(c)) cache.set(c, mat(c));
    return cache.get(c);
  };
  const b = (c, x, y, z, w, h, d, r = 0) => box(g, m(c), x, y, z, w, h, d, r);
  const h = 2.3 + (i % 3) * 0.55,
    w = 3.2;
  b(0x8a7862, 0, 0.12, 0, w + 0.2, 0.24, 2.7);
  b(colors[i % 6], 0, h / 2 + 0.2, 0, w, h, 2.4);
  b(0xf1e4be, 0, h - 0.12, 1.22, w, 0.14, 0.09);
  // Terracotta roof with individual staggered tile courses and a raised ridge.
  for (const side of [-1, 1])
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 7; col++) {
        const xx = -1.65 + col * 0.53,
          zz = side * (row * 0.3 + 0.1),
          yy = h + 0.75 - row * 0.125;
        b((row + col) % 3 ? 0xae553d : 0xd07949, xx, yy, zz, 0.55, 0.11, 0.38, 0);
      }
  b(0xde9561, 0, h + 0.8, 0, 3.7, 0.14, 0.16);
  // Recessed timber door, bright window reveals, shutters, lintels and flower boxes.
  b(0x5a3c35, -0.65, 0.95, 1.23, 0.7, 1.5, 0.1);
  b(0x8b5d43, -0.65, 0.95, 1.3, 0.56, 1.37, 0.08);
  b(0xf3ce69, -0.43, 0.94, 1.36, 0.07, 0.07, 0.05);
  for (const xx of [0.67]) {
    b(0xf4ebc7, xx, 1.62, 1.25, 1.06, 1.15, 0.12);
    b(0x285b70, xx, 1.62, 1.33, 0.83, 0.89, 0.06);
    b(0x79d4d1, xx - 0.18, 1.72, 1.37, 0.28, 0.65, 0.025);
    b(0xf4ebc7, xx, 1.62, 1.4, 0.07, 0.91, 0.05);
    b(0xf4ebc7, xx, 1.62, 1.4, 0.84, 0.07, 0.05);
    for (const s of [-1, 1]) {
      b(0x377875, xx + s * 0.65, 1.62, 1.27, 0.22, 0.95, 0.1);
      for (let j = 0; j < 5; j++)
        b(0x63a197, xx + s * 0.65, 1.27 + j * 0.16, 1.34, 0.22, 0.04, 0.04);
    }
    b(0x97513c, xx, 0.96, 1.5, 1.05, 0.25, 0.36);
    for (let j = 0; j < 5; j++) {
      b(0x588546, xx - 0.4 + j * 0.2, 1.16, 1.5, 0.17, 0.22, 0.14);
      b([0xee7461, 0xf6cc6b, 0xcb7dc0][j % 3], xx - 0.4 + j * 0.2, 1.3, 1.52, 0.14, 0.14, 0.12);
    }
  }
  b(0xcfb794, 0, 0.2, 1.5, 3.8, 0.14, 0.6);
  b(0xe9d2aa, 0, 0.08, 1.83, 4.1, 0.12, 0.4);
  if (i % 3 === 0) {
    b(0x415d6f, -0.8, h + 0.35, -0.65, 0.7, 0.85, 0.7);
    b(0x91b8c1, -0.8, h + 0.8, -0.65, 0.8, 0.12, 0.8);
  }
  if (i % 4 === 1) {
    const text = ['MERCEARIA', 'BAR DO ZÉ', 'PADARIA', 'LAN HOUSE'][Math.floor(i / 4) % 4];
    mesh(g, new T.PlaneGeometry(2.2, 0.4), label(text, '#183f47', '#ffe6a3'), 0, h - 0.42, 1.28);
    for (let j = 0; j < 8; j++)
      b(j % 2 ? 0xf9e4a3 : 0xca524b, -1.65 + j * 0.47, h - 0.82, 1.6, 0.46, 0.11, 0.7);
  }
  return g;
}
export function enrichWorld(group, map, movers) {
  const cache = new Map();
  const m = c => {
    if (!cache.has(c)) cache.set(c, mat(c));
    return cache.get(c);
  };
  const b = (p, c, x, y, z, w, h, d, r = 0) => box(p, m(c), x, y, z, w, h, d, r);
  const root = (x, y, z) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    group.add(g);
    return g;
  };
  const skyMat = new T.ShaderMaterial({
    depthWrite: false,
    uniforms: {top: {value: new T.Color(0x409fc7)}, bottom: {value: new T.Color(0xffe2af)}},
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'uniform vec3 top;uniform vec3 bottom;varying vec2 vUv;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(0.08,0.32,vUv.y)),1.);\n#include <colorspace_fragment>\n}',
    toneMapped: false,
  });
  const sky = mesh(group, new T.PlaneGeometry(300, 120), skyMat, 0, 15, -110);
  sky.castShadow = false;
  sky.receiveShadow = false;
  // A warm low sun and sculpted, stepped cloud banks.
  const sun = mesh(
    group,
    new T.CircleGeometry(2.1, 32),
    new T.MeshBasicMaterial({color: 0xffe9ab}),
    18,
    6.8,
    -66,
  );
  sun.castShadow = false;
  for (let i = 0; i < 5; i++) {
    const c = root(-34 + i * 17, 7 + (i % 2) * 2, -49);
    const v = new Voxels(0.45);
    for (let j = 0; j < 4; j++)
      v.ellipsoid(
        (j - 1.5) * 1.2,
        Math.sin(j * 2) * 0.3,
        0,
        1.25,
        0.65 + 0.25 * (j % 2),
        0.55,
        j % 2 ? 0xfff5dc : 0xe9eddf,
      );
    c.add(v.build());
    movers.push({type: 'cloud', g: c, base: c.position.clone(), seed: i});
  }
  if (map.id === 'cipo') {
    const tower = root(10, -4.8, -23);
    for (const x of [-0.8, 0.8])
      for (const z of [-0.7, 0.7]) b(tower, 0xa68c68, x, 2.8, z, 0.16, 5.6, 0.16);
    for (let j = 0; j < 4; j++) {
      b(tower, 0x7d7760, 0, 1 + j * 1.1, 0.7, 1.7, 0.08, 0.08);
      b(tower, 0x7d7760, 0, 1.5 + j * 1.1, 0.7, 2, 0.08, 0.08, 0.6);
    }
    b(tower, 0x478e9c, 0, 5.5, 0, 2.3, 1.8, 1.9);
    b(tower, 0x80b7bd, 0, 6.45, 0, 2.55, 0.17, 2.1);
    mesh(
      tower,
      new T.PlaneGeometry(1.95, 0.55),
      label('CIPÓ GUAÇU', '#478e9c', '#fff2bd'),
      0,
      5.6,
      0.97,
    );
    const church = root(-12, -4.8, -23);
    b(church, 0xe7d4a4, 0, 2, 0, 4, 4, 3);
    b(church, 0xd4b986, 2, 3, 0, 1.4, 6, 1.7);
    b(church, 0xb15f3e, 2, 6.2, 0, 1.7, 0.3, 1.9);
    b(church, 0xe8d3a1, 2, 6.9, 0, 0.12, 1.1, 0.12);
    b(church, 0xe8d3a1, 2, 7.1, 0, 0.6, 0.12, 0.12);
    b(church, 0x594a3c, 0, 1.2, 1.53, 0.9, 2.4, 0.08);
    b(church, 0xf3d57b, 0, 3, 1.54, 0.55, 0.65, 0.08);
    b(church, 0x584d42, 2, 5.2, 0.87, 0.56, 0.75, 0.08);
  }
  // Low ripples slide independently of the land and shimmer with the sunlight. Only the Amazon
  // has water in the middle ground now (see buildWorld).
  for (let i = 0; i < (map.id === 'amazonia' ? 22 : 0); i++) {
    const wave = b(
      group,
      i % 2 ? 0x93dbd2 : 0xc4e9d4,
      -40 + i * 4,
      -4.78,
      -4 - (i % 3) * 1.2,
      1 + (i % 4) * 0.7,
      0.025,
      0.07,
    );
    movers.push({type: 'ripple', g: wave, base: wave.position.clone(), seed: i});
  }
  return skyMat;
}

// Flower beds scattered along the ground give it scale and colour. They belong to a scrolling
// parallax layer (see buildWorld): placed straight in the scene they would stay still while the
// houses slide past them. One layer spans 70 units, so 25 beds tile seamlessly.
export function flowerBeds(parent, map) {
  const cache = new Map();
  const m = c => {
    if (!cache.has(c)) cache.set(c, mat(c));
    return cache.get(c);
  };
  for (let i = 0; i < 25; i++) {
    const g = new T.Group();
    g.position.set(-35 + i * 2.8, -4.7, i % 2 ? -3 : -18);
    parent.add(g);
    const bloom = map.id === 'amazonia' ? 0xe78175 : [0xf2ca67, 0xe77686, 0xab8bc6][i % 3];
    for (let j = 0; j < 3; j++) {
      box(g, m(0x447547), j * 0.18, 0.16 + j * 0.06, 0, 0.065, 0.38, 0.065);
      box(g, m(bloom), j * 0.18, 0.4 + j * 0.06, 0, 0.18, 0.14, 0.15);
    }
  }
}

// Patches of lighter and darker ground break up the flat colour. Like the flower beds they sit in
// a scrolling layer (70 units wide).
export function groundPatches(parent, map) {
  const patches = new T.Group();
  parent.add(patches);
  const base = new T.Color(map.ground);
  const hash = n => {
    const x = Math.sin(n * 91.7 + 17.3) * 43758.5453;
    return x - Math.floor(x);
  };
  const shades = [0.9, 0.95, 1.06, 1.1].map(f => mat(base.clone().multiplyScalar(f)));
  for (let i = 0; i < 44; i++) {
    const w = 1.2 + hash(i) * 2.6,
      d = 0.5 + hash(i + 50) * 1.3;
    box(
      patches,
      shades[i % shades.length],
      -35 + hash(i + 100) * 70,
      -4.82,
      -11 + hash(i + 150) * 10,
      w,
      0.02,
      d,
    );
  }
  return patches;
}

// The wavy black-and-white stripes of the Rio calçadão, as a tiling pixel texture (one tile is
// 14 world units wide and 7 deep). Returns null without a DOM (tests).
export const CALCADAO_TILE = 14;
export function calcadaoTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 64; x++) {
      const wave = Math.round(5 * Math.sin((x / 64) * Math.PI * 4));
      ctx.fillStyle = ((y + wave + 32) >> 3) % 2 ? '#1f2b33' : '#f3ede0';
      ctx.fillRect(x, y, 1, 1);
    }
  const t = new T.CanvasTexture(c);
  t.magFilter = T.NearestFilter;
  t.minFilter = T.NearestFilter;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(200 / CALCADAO_TILE, 28.5 / (CALCADAO_TILE / 2));
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
