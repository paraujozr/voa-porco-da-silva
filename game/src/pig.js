import * as T from 'three';
// Surface-only voxel meshing: one draw call per articulated part, no hidden cube faces.
export class Voxels {
  constructor(size = 0.13) {
    this.size = size;
    this.cells = new Map();
  }
  set(x, y, z, c) {
    this.cells.set(`${x},${y},${z}`, c);
  }
  cube(cx, cy, cz, w, h, d, color) {
    const s = this.size;
    for (let x = Math.round((cx - w / 2) / s); x < Math.round((cx + w / 2) / s); x++)
      for (let y = Math.round((cy - h / 2) / s); y < Math.round((cy + h / 2) / s); y++)
        for (let z = Math.round((cz - d / 2) / s); z < Math.round((cz + d / 2) / s); z++)
          this.set(x, y, z, color);
    return this;
  }
  ellipsoid(cx, cy, cz, rx, ry, rz, color) {
    const s = this.size;
    for (let x = Math.floor((cx - rx) / s); x <= Math.ceil((cx + rx) / s); x++)
      for (let y = Math.floor((cy - ry) / s); y <= Math.ceil((cy + ry) / s); y++)
        for (let z = Math.floor((cz - rz) / s); z <= Math.ceil((cz + rz) / s); z++) {
          if (((x * s - cx) / rx) ** 2 + ((y * s - cy) / ry) ** 2 + ((z * s - cz) / rz) ** 2 <= 1)
            this.set(x, y, z, typeof color === 'function' ? color(x * s, y * s, z * s) : color);
        }
    return this;
  }
  build() {
    const s = this.size,
      vertices = [],
      colors = [],
      normals = [];
    const faces = [
      [
        [1, 0, 0],
        [
          [1, 0, 0],
          [1, 1, 0],
          [1, 1, 1],
          [1, 0, 1],
        ],
      ],
      [
        [-1, 0, 0],
        [
          [0, 0, 1],
          [0, 1, 1],
          [0, 1, 0],
          [0, 0, 0],
        ],
      ],
      [
        [0, 1, 0],
        [
          [0, 1, 1],
          [1, 1, 1],
          [1, 1, 0],
          [0, 1, 0],
        ],
      ],
      [
        [0, -1, 0],
        [
          [0, 0, 0],
          [1, 0, 0],
          [1, 0, 1],
          [0, 0, 1],
        ],
      ],
      [
        [0, 0, 1],
        [
          [1, 0, 1],
          [1, 1, 1],
          [0, 1, 1],
          [0, 0, 1],
        ],
      ],
      [
        [0, 0, -1],
        [
          [0, 0, 0],
          [0, 1, 0],
          [1, 1, 0],
          [1, 0, 0],
        ],
      ],
    ];
    for (const [key, hex] of this.cells) {
      const [x, y, z] = key.split(',').map(Number);
      const c = new T.Color(hex);
      const shade = 1 + ((Math.abs(x * 73 + y * 37 + z * 17) % 9) - 4) * 0.003;
      c.multiplyScalar(shade);
      for (const [n, points] of faces) {
        if (this.cells.has(`${x + n[0]},${y + n[1]},${z + n[2]}`)) continue;
        for (const idx of [0, 1, 2, 0, 2, 3]) {
          const p = points[idx];
          vertices.push((x + p[0] - 0.5) * s, (y + p[1] - 0.5) * s, (z + p[2] - 0.5) * s);
          normals.push(...n);
          colors.push(c.r, c.g, c.b);
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    const m = new T.Mesh(geo, new T.MeshLambertMaterial({vertexColors: true}));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}
export const mat = c => new T.MeshLambertMaterial({color: c});
export function mesh(parent, geo, material, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function box(p, m, x, y, z, w, h, d, r = 0) {
  const o = mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z);
  o.rotation.z = r;
  return o;
}
export function ball(p, m, x, y, z, sx, sy = sx, sz = sx) {
  return box(p, m, x, y, z, sx * 2, sy * 2, sz * 2);
}
export function disposeGroup(group) {
  const geos = new Set(),
    mats = new Set();
  group.traverse(o => {
    if (o.geometry) geos.add(o.geometry);
    if (o.material)
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
  });
  geos.forEach(g => g.dispose());
  mats.forEach(m => {
    m.map?.dispose();
    m.dispose();
  });
  group.removeFromParent();
}
export function label(text, bg = '#15334c', fg = '#ffdf65', w = 512) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 112;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, 112);
  ctx.fillStyle = fg;
  ctx.font = `900 ${Math.min(74, (w - 28) / (text.length * 0.63))}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, 58, w - 24);
  const t = new T.CanvasTexture(c);
  t.magFilter = T.NearestFilter;
  t.minFilter = T.LinearFilter;
  t.colorSpace = T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map: t, side: T.DoubleSide});
}
export function makePig(data) {
  const g = new T.Group(),
    id = data.id,
    skin = data.skin,
    shirt = data.shirt;
  const dog = id === 'delivery';
  const C = {
    dark: 0x292339,
    hoof: 0x382735,
    pink: 0xe67d91,
    inner: 0xf38da2,
    white: 0xfff7e8,
    gold: 0xffc547,
  };
  const part = (parent, fn, size = 0.065) => {
    const v = new Voxels(size);
    fn(v);
    const o = v.build();
    parent.add(o);
    return o;
  };
  const group = (p, x, y, z) => {
    const o = new T.Group();
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };
  const cube = (p, c, x, y, z, w, h, d, r = 0) => box(p, mat(c), x, y, z, w, h, d, r);
  const oval = (p, c, x, y, z, rx, ry, rz) => part(p, v => v.ellipsoid(x, y, z, rx, ry, rz, c));
  const patch = (p, text, x, y, z, w, h, bg = '#fff7e8', fg = '#24304a') => {
    cube(p, 0x263044, x, y, z, w + 0.04, h + 0.04, 0.045);
    if (typeof document !== 'undefined')
      mesh(p, new T.PlaneGeometry(w, h), label(text, bg, fg, 256), x, y, z + 0.025);
  };
  const body = group(g, -0.12, -0.25, 0);
  part(body, v => {
    v.ellipsoid(0, 0, 0, 0.68, 0.78, 0.47, shirt);
    v.ellipsoid(0, 0.65, 0, 0.4, 0.3, 0.33, skin);
  });
  // A complete jacket or shirt wraps around the torso. Hems and seams read at game scale.
  const dressed = !['mandrake', 'babe', 'torresmo', 'waddles', 'hamm', 'hawk'].includes(id);
  if (dressed) {
    cube(body, 0x26334e, 0, -0.59, 0.37, 1.03, 0.13, 0.18);
    cube(body, new T.Color(shirt).multiplyScalar(0.65), 0, -0.05, 0.465, 0.055, 1.05, 0.045);
  }
  const head = group(g, 0.03, 0.82, 0.02);
  part(head, v => {
    v.ellipsoid(0, 0, 0, 0.79, 0.7, 0.58, skin);
    v.ellipsoid(-0.47, -0.18, 0.38, 0.28, 0.27, 0.22, skin);
    v.ellipsoid(0.47, -0.18, 0.38, 0.28, 0.27, 0.22, skin);
  });
  // Two high contrast eyes, raised brows, muzzle and mouth are separate sculpted features.
  for (const side of [-1, 1]) {
    oval(head, C.white, side * 0.33, 0.16, 0.5, 0.23, 0.29, 0.105);
    oval(head, C.dark, side * 0.3, 0.14, 0.59, 0.115, 0.17, 0.045);
    cube(head, C.white, side * 0.3 - 0.025, 0.23, 0.64, 0.075, 0.09, 0.025);
    cube(head, 0x784a47, side * 0.34, 0.48, 0.48, 0.31, 0.07, 0.07, side * 0.1);
    oval(head, 0xf08b98, side * 0.54, -0.23, 0.48, 0.14, 0.1, 0.045);
  }
  if (dog) {
    oval(head, 0xe8bc7b, 0, -0.25, 0.65, 0.4, 0.27, 0.32);
    oval(head, 0x261d25, 0, -0.16, 0.95, 0.22, 0.14, 0.12);
    cube(head, 0xf6e4be, -0.06, -0.1, 1.055, 0.09, 0.045, 0.02);
  } else {
    oval(head, 0xb94d70, 0, -0.22, 0.59, 0.39, 0.245, 0.21);
    oval(head, 0xf299a6, 0, -0.19, 0.73, 0.36, 0.205, 0.13);
    for (const side of [-1, 1]) oval(head, 0x772f4e, side * 0.145, -0.17, 0.85, 0.065, 0.09, 0.03);
  }
  cube(head, 0x643346, 0, -0.49, 0.53, 0.34, 0.06, 0.05);
  cube(head, 0xffffff, 0.11, -0.47, 0.56, 0.12, 0.07, 0.03);
  const ears = [];
  for (const side of [-1, 1]) {
    const e = group(head, side * 0.55, 0.53, -0.04);
    e.rotation.z = -side * 0.25;
    part(e, v => {
      v.ellipsoid(0, 0.2, 0, 0.225, 0.36, 0.15, skin);
      v.ellipsoid(0, 0.22, 0.13, 0.13, 0.24, 0.055, C.inner);
    });
    if (dog) {
      e.position.set(side * 0.7, 0.06, -0.04);
      e.scale.set(0.85, 1.05, 0.75);
      e.rotation.z = side * 2.4;
    }
    ears.push(e);
  }
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = group(g, -0.12 + side * 0.38, -0.94, 0.02);
    leg.rotation.z = side * 0.12;
    part(leg, v => {
      v.ellipsoid(0, -0.13, 0, 0.22, 0.3, 0.24, dressed ? 0x35516d : skin);
      v.cube(0, -0.38, 0.13, 0.44, 0.24, 0.52, id === 'peppa' ? C.gold : C.hoof);
      if (!dog) v.cube(0, -0.39, 0.4, 0.045, 0.19, 0.035, 0x171c2b);
    });
    limbs.push(leg);
    const arm = group(body, side * 0.61, 0.22, 0.02);
    arm.rotation.z = side * 0.22;
    part(arm, v => {
      v.ellipsoid(0, -0.13, 0, 0.23, 0.34, 0.27, dressed ? shirt : skin);
      v.ellipsoid(0, -0.46, 0.07, 0.21, 0.22, 0.23, id === 'piggy' ? 0xb17bd6 : skin);
      v.cube(0, -0.58, 0.16, 0.3, 0.1, 0.23, C.hoof);
    });
    limbs.push(arm);
  }
  const tail = group(body, -0.64, -0.28, -0.1);
  part(tail, v => {
    if (dog) {
      for (let i = 0; i < 10; i++)
        v.ellipsoid(-0.08 - i * 0.055, i * 0.035, 0, 0.09, 0.1, 0.09, i > 6 ? 0xe8bc7b : skin);
      return;
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 21) * Math.PI * 2;
      v.cube(-0.12 - Math.sin(a) * 0.18, Math.cos(a) * 0.18, -i * 0.007, 0.09, 0.09, 0.09, skin);
    }
  });
  function cap(color, accent, backward = false) {
    oval(head, color, 0, 0.54, -0.04, 0.79, 0.3, 0.61);
    cube(head, accent, 0, 0.55, 0.52, 1.25, 0.11, 0.22);
    cube(
      head,
      color,
      backward ? -0.72 : 0,
      0.5,
      backward ? -0.05 : 0.71,
      backward ? 0.55 : 1.45,
      0.09,
      backward ? 0.6 : 0.52,
    );
    cube(head, accent, 0, 0.83, -0.04, 0.12, 0.09, 0.12);
  }
  function collar(color) {
    for (const side of [-1, 1])
      cube(body, color, side * 0.19, 0.49, 0.43, 0.32, 0.22, 0.08, -side * 0.36);
  }
  function shades() {
    for (const side of [-1, 1]) {
      cube(head, 0x181d35, side * 0.34, 0.17, 0.66, 0.65, 0.43, 0.11);
      cube(head, 0x48d7e9, side * 0.34, 0.22, 0.73, 0.51, 0.22, 0.035);
      cube(head, 0xb66dde, side * 0.34, 0.06, 0.735, 0.51, 0.1, 0.04);
      cube(head, 0xcaffff, side * 0.34 - 0.12, 0.25, 0.76, 0.06, 0.18, 0.025, -0.4);
    }
    cube(head, 0xed559d, 0, 0.21, 0.7, 0.12, 0.09, 0.1);
  }
  function chain() {
    for (let i = 0; i < 17; i++) {
      const x = (i / 16 - 0.5) * 1.12;
      cube(
        body,
        i % 2 ? 0xffe58c : C.gold,
        x,
        0.18 - (1 - (x / 0.6) ** 2) * 0.35,
        0.5,
        0.095,
        0.11,
        0.07,
        i % 2 ? 0.18 : -0.18,
      );
    }
    oval(body, 0xa36925, 0, -0.35, 0.55, 0.18, 0.22, 0.055);
    oval(body, C.gold, 0, -0.32, 0.61, 0.15, 0.19, 0.04);
    cube(body, 0xfff2b0, -0.04, -0.29, 0.66, 0.045, 0.16, 0.02);
  }
  if (id === 'mandrake') {
    cap(0x182b50, 0xee5c9d, true);
    shades();
    chain();
    cube(body, 0x1b344b, 0, -0.58, 0.07, 1.08, 0.3, 0.85);
    for (const s of [-1, 1]) cube(body, 0x57cedb, s * 0.39, -0.62, 0.51, 0.1, 0.22, 0.05);
    patch(head, 'CRIA', -0.18, 0.64, 0.49, 0.48, 0.17, '#14294b', '#ffdc69');
  }
  if (id === 'clt') {
    collar(C.white);
    cube(body, 0x24466e, 0, 0.1, 0.52, 0.12, 0.66, 0.055);
    cube(body, 0x24466e, 0, -0.24, 0.52, 0.18, 0.18, 0.055, Math.PI / 4);
    patch(body, 'CLT', 0.32, 0.13, 0.48, 0.36, 0.3);
    cube(body, 0x72513d, -0.92, -0.5, 0.12, 0.56, 0.65, 0.38);
    cube(body, 0xd5ac74, -0.92, -0.5, 0.33, 0.55, 0.07, 0.03);
    cube(body, 0x493426, -0.92, -0.11, 0.12, 0.3, 0.13, 0.2);
  }
  if (id === 'maker') {
    cap(0x191c30, 0xf04a91);
    collar(0xf04a91);
    patch(body, 'FIAP', 0, 0.17, 0.51, 0.83, 0.27, '#222338', '#ff4e93');
    patch(body, 'MAKER LAB', 0, -0.16, 0.49, 0.77, 0.16, '#222338', '#f7f1e7');
    cube(body, 0x1c7e6e, -0.86, -0.25, 0.31, 0.44, 0.6, 0.12);
    cube(body, 0x1c2b3a, -0.86, -0.25, 0.39, 0.2, 0.24, 0.03);
    for (let i = 0; i < 4; i++) cube(body, C.gold, -1.01 + i * 0.1, -0.02, 0.39, 0.04, 0.1, 0.03);
  }
  if (id === 'obra') {
    oval(head, 0xf5bf35, 0, 0.5, 0, 0.82, 0.42, 0.64);
    cube(head, 0xffda56, 0, 0.49, 0.1, 1.8, 0.12, 1.5);
    cube(head, 0xffda56, 0, 0.8, 0.02, 0.15, 0.23, 1.02);
    for (const s of [-1, 1]) cube(body, C.white, s * 0.34, 0, 0.45, 0.12, 1, 0.09);
    cube(body, C.white, 0, -0.31, 0.47, 1.1, 0.12, 0.08);
    patch(head, 'OBRA', 0, 0.66, 0.61, 0.56, 0.18, '#ffcf3f', '#293647');
  }
  if (id === 'craque') {
    collar(0x16844f);
    patch(body, '10', 0, 0.08, 0.5, 0.58, 0.56, '#f4d14b', '#12683d');
    cube(head, 0xf9e3a2, 0, 0.49, 0.49, 1.24, 0.12, 0.16);
  }
  if (id === 'praia') {
    oval(head, 0xddae64, 0, 0.61, 0, 0.58, 0.32, 0.52);
    cube(head, 0xf3d590, 0, 0.45, 0.1, 1.9, 0.12, 1.7);
    cube(head, 0x83553a, 0, 0.55, 0.5, 1.15, 0.15, 0.12);
    shades();
    patch(body, 'MATE', 0, 0.1, 0.5, 0.6, 0.25, '#4ab4bc', '#fff4db');
  }
  if (id === 'delivery') {
    const helmet = group(head, 0, 0, 0);
    helmet.name = 'capacete-moto';
    part(helmet, v => {
      const step = 0.065;
      for (let x = -0.91; x <= 0.91; x += step)
        for (let y = -0.59; y <= 0.88; y += step)
          for (let z = -0.7; z <= 0.72; z += step) {
            const d = (x / 0.9) ** 2 + ((y - 0.12) / 0.78) ** 2 + (z / 0.7) ** 2;
            if (d <= 1 && d > 0.72 && (z < 0.15 || y > 0.43 || Math.abs(x) > 0.67 || y < -0.35))
              v.cube(x, y, z, step, step, step, Math.abs(x) < 0.1 ? 0xffd452 : 0xd93545);
          }
    });
    cube(helmet, 0x192b43, 0, 0.45, 0.58, 1.43, 0.13, 0.2);
    cube(helmet, 0x192b43, 0, -0.46, 0.58, 1.34, 0.16, 0.22);
    for (const side of [-1, 1]) {
      oval(helmet, 0x152a40, side * 0.76, 0.13, 0.38, 0.12, 0.15, 0.11);
      oval(helmet, 0xf6bd3e, side * 0.8, 0.13, 0.43, 0.07, 0.08, 0.06);
    }
    const visor = box(
      helmet,
      new T.MeshLambertMaterial({
        color: 0x74d5e7,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
      0,
      0.1,
      0.71,
      1.32,
      0.57,
      0.045,
    );
    visor.name = 'viseira';
    cube(helmet, 0xd6f7ff, -0.46, 0.22, 0.746, 0.065, 0.31, 0.018, -0.2);
    cube(body, 0xd93545, 0, 0.15, -0.65, 1.35, 1.25, 0.58);
    cube(body, 0xffd452, 0, 0.35, -0.96, 1.15, 0.12, 0.04);
    for (const side of [-1, 1]) {
      cube(body, 0x191f31, side * 0.38, 0.18, 0.48, 0.12, 0.98, 0.1);
      cube(body, 0xf7e2ad, side * 0.38, 0.1, 0.55, 0.14, 0.11, 0.035);
    }
    patch(body, 'DELIVERY', 0, 0.16, 0.55, 0.58, 0.2, '#26364e', '#ffdf65');
    patch(body, 'CACHORRO LOUCO', 0, -0.1, 0.52, 0.8, 0.14, '#26364e', '#ffffff');
  }
  if (id === 'maromba') {
    cube(head, 0xb6df65, 0, 0.48, 0.5, 1.35, 0.16, 0.18);
    patch(body, 'TÁ PAGO', 0, 0.11, 0.5, 0.85, 0.26, '#8559a5', '#ffffff');
  }
  if (id === 'coroa' || id === 'rabico') {
    cube(head, C.gold, 0, 0.63, 0, 1.35, 0.26, 1.02);
    for (const x of [-0.54, 0, 0.54]) cube(head, C.gold, x, 0.86, 0.39, 0.18, 0.38, 0.2);
    oval(head, 0xde456c, 0, 0.69, 0.55, 0.14, 0.14, 0.04);
    if (id === 'rabico') collar(C.white);
    else chain();
  }
  if (id === 'babe') {
    collar(0xa53839);
    oval(body, C.gold, 0, 0.28, 0.5, 0.13, 0.15, 0.05);
  }
  if (id === 'porky') {
    collar(C.white);
    for (const s of [-1, 1]) cube(body, 0xdb3c51, s * 0.17, 0.4, 0.57, 0.27, 0.24, 0.09, s * 0.28);
    cube(body, 0xad233a, 0, 0.4, 0.63, 0.13, 0.13, 0.06);
  }
  if (id === 'piggy') {
    oval(head, 0xe7b44d, 0, 0.55, -0.12, 0.8, 0.4, 0.62);
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++)
        oval(
          head,
          i % 2 ? 0xf4cb68 : 0xd79b3b,
          s * (0.6 + i * 0.025),
          0.4 - i * 0.25,
          0.02,
          0.2,
          0.34,
          0.27,
        );
    for (const s of [-1, 1]) {
      cube(head, C.dark, s * 0.34, 0.43, 0.59, 0.41, 0.065, 0.06, s * 0.12);
      oval(head, C.gold, s * 0.74, -0.25, 0.13, 0.09, 0.13, 0.06);
    }
    for (let i = 0; i < 9; i++)
      oval(
        body,
        C.white,
        (i - 4) * 0.11,
        0.33 - Math.sin((i / 8) * Math.PI) * 0.2,
        0.5,
        0.055,
        0.06,
        0.04,
      );
  }
  if (id === 'piglet') {
    for (let i = 0; i < 4; i++) cube(body, 0x8b2c64, 0, 0.34 - i * 0.25, 0.44, 1.02, 0.075, 0.1);
    ears.forEach(e => (e.scale.y = 1.45));
  }
  if (id === 'peppa') {
    part(body, v => {
      for (let y = -0.65; y < 0.15; y += 0.065)
        v.ellipsoid(0, y, 0, 0.72 - (y + 0.65) * 0.2, 0.05, 0.5, 0xdd3d50);
    });
  }
  if (id === 'torresmo') {
    for (const [x, y] of [
      [-0.4, 0.1],
      [0.3, -0.3],
    ])
      oval(body, 0x825136, x, y, 0.43, 0.2, 0.16, 0.04);
    oval(head, 0x956447, 0.49, 0.42, 0.44, 0.19, 0.13, 0.06);
  }
  if (id === 'gobbato') {
    collar(C.white);
    patch(body, 'P', 0, 0.15, 0.5, 0.48, 0.5, '#ffffff', '#08723f');
    for (const s of [-1, 1]) cube(head, C.white, s * 0.38, -0.32, 0.68, 0.11, 0.35, 0.12, s * -0.2);
  }
  if (id === 'spiderham') {
    const red = 0xd72b43,
      ink = 0x14223d,
      blue = 0x2455b4;
    // Sculpted mask, stepped lenses and raised webbing remain readable at play scale.
    oval(head, red, 0, 0, 0.02, 0.81, 0.71, 0.59);
    for (const side of [-1, 1]) {
      part(
        head,
        v => {
          for (let row = 0; row < 5; row++) {
            const width = 0.48 - row * 0.055;
            v.cube(side * (0.31 + row * 0.012), 0.32 - row * 0.075, 0.665, width, 0.08, 0.09, ink);
            v.cube(
              side * (0.31 + row * 0.012),
              0.31 - row * 0.065,
              0.72,
              Math.max(0.09, width - 0.1),
              0.06,
              0.035,
              0xfff9ef,
            );
          }
        },
        0.035,
      );
      for (let i = 0; i < 3; i++)
        cube(
          head,
          ink,
          side * (0.14 + i * 0.19),
          0.47 - i * 0.04,
          0.55 - i * 0.025,
          0.025,
          0.3,
          0.025,
          side * -0.45,
        );
      cube(body, blue, side * 0.42, -0.14, 0.39, 0.29, 0.8, 0.2);
      oval(limbs[side === -1 ? 1 : 3], red, 0, -0.44, 0.07, 0.235, 0.27, 0.25);
      oval(limbs[side === -1 ? 0 : 2], blue, 0, -0.08, 0, 0.23, 0.25, 0.25);
      cube(limbs[side === -1 ? 0 : 2], red, 0, -0.34, 0.13, 0.47, 0.34, 0.54);
      for (let i = 0; i < 3; i++)
        cube(
          body,
          ink,
          side * 0.15,
          0.16 - i * 0.08,
          0.56,
          0.3,
          0.025,
          0.035,
          side * (0.5 - i * 0.5),
        );
    }
    cube(body, red, 0, 0.12, 0.49, 0.5, 0.87, 0.1);
    oval(body, ink, 0, 0.12, 0.56, 0.085, 0.14, 0.035);
    oval(body, ink, 0, 0.29, 0.56, 0.055, 0.06, 0.035);
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++)
        cube(
          body,
          ink,
          side * 0.16,
          0.2 - i * 0.08,
          0.57,
          0.27,
          0.025,
          0.03,
          side * (0.65 - i * 0.4),
        );
    oval(head, red, 0, -0.2, 0.73, 0.37, 0.215, 0.14);
    for (const side of [-1, 1]) oval(head, ink, side * 0.145, -0.17, 0.86, 0.06, 0.08, 0.025);
    for (const y of [0.43, -0.02, -0.4]) cube(head, ink, 0, y, 0.61, 1.1, 0.025, 0.025);
    cube(head, ink, 0, 0.29, 0.62, 0.025, 0.66, 0.03);
  }
  if (id === 'waddles') {
    oval(body, 0xb7667d, -0.35, 0.25, 0.4, 0.28, 0.28, 0.1);
    oval(head, 0xb7667d, -0.47, 0.47, 0.31, 0.25, 0.2, 0.17);
  }
  if (id === 'hamm') {
    cube(head, 0x513040, 0, 0.68, 0, 0.62, 0.055, 0.12);
    oval(body, 0xb2804e, 0, -0.15, 0.48, 0.21, 0.21, 0.045);
  }
  if (id === 'queijo') {
    part(head, v => {
      v.cube(0, 0.8, 0, 1.2, 0.28, 0.85, 0xffd04c);
      v.cube(-0.2, 1.03, 0, 0.8, 0.2, 0.65, 0xffd04c);
      for (const x of [-0.35, 0, 0.35]) v.cube(x, 0.83, 0.44, 0.14, 0.12, 0.05, 0xb78326);
    });
    part(body, v => {
      v.cube(0, -0.12, 0.53, 0.78, 0.78, 0.12, 0xffeed0);
      v.cube(0, -0.1, 0.62, 0.35, 0.25, 0.05, 0xffc337);
    });
  }
  if (id === 'hawk') {
    collar(0x357d4f);
    oval(body, 0xc8d5b1, 0, 0.28, 0.54, 0.15, 0.18, 0.05);
  }
  // Raised feather fans sit behind the shoulders, leaving costume and face unobstructed.
  const wings = [];
  for (const side of [-1, 1]) {
    const w = group(g, -0.12 + side * 0.51, 0.1, -0.38);
    w.rotation.y = side * 0.16;
    for (let i = 0; i < 5; i++) {
      const f = group(w, side * (0.2 + i * 0.15), 0.13 + i * 0.12, -0.04);
      f.rotation.z = -side * (0.43 + i * 0.12);
      part(
        f,
        v => {
          v.ellipsoid(0, 0.28, 0, 0.14, 0.62 - i * 0.045, 0.1, 0xaac4da);
          v.ellipsoid(
            -side * 0.025,
            0.32,
            0.055,
            0.115,
            0.56 - i * 0.04,
            0.075,
            i % 2 ? 0xf4f8ed : 0xdcecf0,
          );
        },
        0.065,
      );
    }
    wings.push(w);
  }
  g.userData = {wings, ears, limbs, body, head, tail, dog};
  return g;
}
