import * as T from 'three';
import {Voxels, mat, box, mesh, label} from './pig.js';
import {
  detailedTree,
  detailedHouse,
  enrichWorld,
  flowerBeds,
  groundPatches,
  calcadaoTexture,
  CALCADAO_TILE,
} from './scenery.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const rnd = n => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function buildWorld(scene, map) {
  const group = new T.Group();
  scene.add(group);
  scene.background = new T.Color(map.sky);
  scene.fog = new T.Fog(map.fog, 65, 150);
  const movers = [],
    layers = [],
    cache = new Map();
  const m = c => {
    if (!cache.has(c)) cache.set(c, mat(c));
    return cache.get(c);
  };
  const b = (p, c, x, y, z, w, h, d, r = 0) => box(p, m(c), x, y, z, w, h, d, r);
  let distance = 0;
  function root(p, x, y, z) {
    const g = new T.Group();
    g.position.set(x, y, z);
    p.add(g);
    return g;
  }
  function sign(p, text, x, y, z, w = 3) {
    b(p, 0x79563d, x, y - 1, z, 0.12, 2, 0.13);
    b(p, 0x4d3d35, x, y, z, w + 0.2, 0.85, 0.22);
    mesh(p, new T.PlaneGeometry(w, 0.68), label(text), x, y, z + 0.13);
  }
  function tree(p, x, z, h = 5, type = 'leaf') {
    const g = detailedTree(p, x, z, h, type);
    if (type === 'palm') movers.push({type: 'palm', g, seed: x});
  }
  function house(p, x, z, i) {
    return detailedHouse(p, x, z, i);
  }
  function dog(p, x, z) {
    const g = root(p, x, -4.5, z),
      v = new Voxels(0.14);
    v.cube(0, 0.4, 0, 1, 0.43, 0.35, 0xc78b48);
    v.cube(0.48, 0.65, 0, 0.4, 0.43, 0.4, 0xd8a25a);
    v.cube(0.72, 0.56, 0, 0.3, 0.18, 0.28, 0xc78b48);
    v.cube(0.88, 0.58, 0, 0.1, 0.1, 0.12, 0x372f30);
    for (const s of [-1, 1]) {
      v.cube(0.34, 0.87, s * 0.15, 0.15, 0.3, 0.14, 0x8e6139);
      v.cube(0.6, 0.73, s * 0.2, 0.08, 0.08, 0.06, 0x252c34);
      for (const xx of [-0.35, 0.35]) v.cube(xx, 0.1, s * 0.12, 0.13, 0.4, 0.13, 0xc78b48);
    }
    g.add(v.build());
    movers.push({type: 'walk', g, base: g.position.clone(), seed: x});
  }
  function capy(p, x, z) {
    const g = root(p, x, -4.7, z),
      v = new Voxels(0.16);
    v.ellipsoid(0, 0.4, 0, 0.8, 0.42, 0.36, 0xa78153);
    v.cube(0.65, 0.6, 0, 0.7, 0.6, 0.55, 0xb18b5a);
    for (const s of [-1, 1]) {
      v.cube(0.48, 0.94, s * 0.22, 0.15, 0.15, 0.12, 0x896844);
      v.cube(0.85, 0.75, s * 0.29, 0.08, 0.1, 0.07, 0x202d2d);
      for (const xx of [-0.45, 0.45]) v.cube(xx, 0.06, s * 0.2, 0.2, 0.3, 0.2, 0x896844);
    }
    g.add(v.build());
    movers.push({type: 'capy', g, base: g.position.clone(), seed: x});
  }
  function person(p, x, z, i, politician = false) {
    const g = root(p, x, -4.7, z),
      body = politician ? 0x35485f : [0xde6558, 0xf0cc60, 0x7a9fc7, 0x9c77a6][i % 4];
    b(g, body, 0, 0.8, 0, 0.42, 0.65, 0.3);
    b(g, [0xd9a27d, 0x9c684d, 0xf0c4a0][i % 3], 0, 1.32, 0, 0.38, 0.4, 0.35);
    b(g, 0x463831, 0, 1.55, 0, 0.42, 0.12, 0.38);
    for (const s of [-1, 1]) {
      b(g, 0x2d4360, s * 0.13, 0.25, 0, 0.16, 0.5, 0.2);
      const arm = root(g, s * 0.26, 1, 0);
      b(arm, body, 0, -0.22, 0, 0.14, 0.5, 0.18);
      movers.push({type: 'arm', g: arm, seed: i + s});
    }
    if (politician) b(g, 0xf2dcca, 0, 0.83, 0.17, 0.08, 0.5, 0.05);
    else if (i % 2 === 0) b(g, 0xeed37b, 0, 1.6, 0, 0.7, 0.15, 0.7);
  }
  function stall(p, x, z, i) {
    const g = root(p, x, -4.8, z);
    b(g, 0x976844, 0, 0.6, 0, 2.6, 1.2, 1.2);
    for (const xx of [-1.2, 1.2]) b(g, 0x594c3b, xx, 1.4, 0, 0.12, 2.8, 0.13);
    for (let j = 0; j < 6; j++)
      b(g, j % 2 ? 0xffd55c : 0xd34c4e, -1.25 + j * 0.5, 2.5, 0, 0.5, 0.2, 1.8);
    mesh(
      g,
      new T.PlaneGeometry(2.35, 0.55),
      label(['PASTEL DE VENTO', 'É PAVÊ?', 'CALDO DE CANA', 'MILHO & PIPOCA'][i % 4]),
      0,
      0.77,
      0.62,
    );
    person(g, 0.6, 0.3, i);
  }
  function bus(p, x, z) {
    const g = root(p, x, -4.6, z);
    b(g, 0xdcc375, 0, 0.9, 0, 3.8, 1.6, 1.1);
    b(g, 0x3a8a70, 0, 0.5, 0.57, 3.8, 0.35, 0.08);
    for (let i = 0; i < 5; i++) b(g, 0x34586e, -1.5 + i * 0.64, 1.25, 0.57, 0.48, 0.5, 0.08);
    for (const xx of [-1.25, 1.25])
      for (const s of [-1, 1]) b(g, 0x29333e, xx, 0.08, s * 0.5, 0.5, 0.5, 0.24);
    mesh(g, new T.PlaneGeometry(2, 0.34), label('CIPÓ • CENTRO'), 0, 1.87, 0.57);
    movers.push({type: 'bus', g, base: g.position.clone(), seed: x});
  }
  function stringLights(p, x, z) {
    const g = root(p, x, -4.6, z);
    for (const xx of [-5, 5]) b(g, 0x725b44, xx, 2.2, 0, 0.15, 4.4, 0.15);
    for (let i = 0; i < 17; i++) {
      const xx = -5 + i * 0.625,
        yy = 4.3 - Math.sin((i / 16) * Math.PI) * 0.6;
      b(g, 0x3b4140, xx, yy, 0, 0.7, 0.035, 0.035);
      if (i % 2 === 0) {
        const flag = b(
          g,
          [0xf6c946, 0xdb655a, 0x4ba77d, 0x739ed7][i % 4],
          xx,
          yy - 0.3,
          0,
          0.38,
          0.5,
          0.035,
        );
        movers.push({type: 'flag', g: flag, seed: i});
      } else {
        const lightMat = new T.MeshBasicMaterial({color: 0xffd764});
        const bulb = box(g, lightMat, xx, yy - 0.12, 0, 0.13, 0.18, 0.13);
        movers.push({type: 'bulb', g: bulb, seed: i});
      }
    }
  }
  function bbq(p, x, z) {
    const g = root(p, x, -4.6, z);
    b(g, 0x9a503d, 0, 0.5, 0, 1.1, 1, 1);
    b(g, 0x302c32, 0, 1.1, 0, 1.2, 0.12, 1.1);
    for (let i = 0; i < 4; i++) {
      b(g, 0xdd8b45, -0.35 + i * 0.22, 1.2, 0, 0.16, 0.1, 0.7);
      const smoke = b(g, 0xc8d6cc, 0, 1.5 + i * 0.45, 0, 0.22 + i * 0.12, 0.25 + i * 0.12, 0.25);
      movers.push({type: 'smoke', g: smoke, base: smoke.position.clone(), seed: i});
    }
  }
  function field(p, x, z) {
    const g = root(p, x, -4.68, z);
    b(g, 0x4f9869, 0, 0, 0, 9, 0.08, 4);
    for (const xx of [-4, 4]) {
      b(g, 0xece5ca, xx, 0.8, -0.8, 0.1, 1.6, 0.12);
      b(g, 0xece5ca, xx, 0.8, 0.8, 0.1, 1.6, 0.12);
      b(g, 0xece5ca, xx, 1.6, 0, 0.12, 0.1, 1.7);
    }
    const football = b(g, 0xfff2da, 0, 0.25, 0, 0.36, 0.36, 0.36);
    movers.push({type: 'ball', g: football, base: football.position.clone(), seed: x});
    person(g, 1, 1, 2);
    person(g, -1, -1, 1);
    sign(g, 'RECEBA!', 0, 2, -1.8, 2);
  }
  function skyline(p, id) {
    if (id === 'rio') {
      for (let i = 0; i < 12; i++) {
        const h = 1.7 + rnd(i) * 2.2;
        const x = -32 + i * 5.5;
        b(p, [0xf0ddbd, 0xd3dec8, 0x89b8b8][i % 3], x, -4.8 + h / 2, -13, 2.6, h, 2);
        for (let j = 0; j < 3; j++)
          for (let k = 0; k < 2; k++)
            b(p, 0x497e91, x - 0.65 + k * 1.25, -4.2 + j * 0.75, -11.96, 0.4, 0.4, 0.06);
      }
      for (let i = 0; i < 8; i++) tree(p, -30 + i * 8, -7, 3, 'palm');
    }
    if (id === 'cipo') {
      for (let i = 0; i < 12; i++) {
        house(p, -32 + i * 5.5, -12, i);
        if (i % 2 === 0) tree(p, -29 + i * 5.5, -15, 4);
      }
      stall(p, -21, -7, 0);
      stall(p, -17, -7, 1);
      stall(p, 18, -7, 3);
      field(p, 3, -9);
      bbq(p, 24, -6);
      dog(p, -10, -5.6);
      dog(p, 28, -6);
      bus(p, -1, -15);
      stringLights(p, -19, -7);
      stringLights(p, 20, -7);
      sign(p, 'CIPÓ GUAÇU', -29, -1.9, -6, 4);
      sign(p, 'NA VOLTA A GENTE COMPRA', 13, -2, -7, 4.5);
    }
    if (id === 'brasilia') {
      for (let i = 0; i < 8; i++) person(p, -28 + i * 8, -9, i, true);
      sign(p, 'PROMETO VOAR!', 12, -1.8, -9, 4);
      sign(p, 'SÓ MAIS UMA REUNIÃO', -16, -2, -9, 4);
      for (let i = 0; i < 7; i++) tree(p, -28 + i * 10, -18, 4, 'palm');
    }
    if (id === 'amazonia') {
      for (let i = 0; i < 18; i++) tree(p, -34 + i * 4, -14 - (i % 3) * 3, 5 + rnd(i) * 3);
      for (const xx of [-22, -2, 18]) capy(p, xx, -6);
      const croc = root(p, 10, -4.7, -4);
      b(croc, 0x5d8455, 0, 0.15, 0, 2, 0.3, 0.55);
      b(croc, 0x74945a, 1.25, 0.2, 0, 1, 0.25, 0.45);
      for (const s of [-1, 1]) {
        b(croc, 0x8fa45c, 0.85, 0.4, s * 0.22, 0.2, 0.2, 0.15);
        b(croc, 0x1f3130, 0.92, 0.48, s * 0.23, 0.08, 0.08, 0.08);
      }
      movers.push({type: 'croc', g: croc, base: croc.position.clone(), seed: 10});
      sign(p, 'CALMA, CAPIVARA!', -15, -1.8, -7, 4);
    }
  }
  // Solid ground from the far hills to past the camera, so houses never look afloat. The water
  // plane below only shows beyond its far edge (the sea or river on the horizon) and, in
  // Amazônia, as a narrow river strip in front of the forest.
  b(group, map.water, 0, -5.3, -18, 200, 0.5, 110);
  b(group, map.ground, 0, -5.08, -3.25, 200, 0.5, 66.5);
  if (map.id === 'amazonia') b(group, map.water, 0, -4.86, -5.5, 200, 0.1, 5.5);
  if (map.id === 'cipo' || map.id === 'brasilia') {
    // Pavement along the road with a darker kerb.
    b(group, map.id === 'cipo' ? 0xd9d2bd : 0xe3dcc6, 0, -4.83, -0.5, 200, 0.08, 4);
    b(group, 0xb8b199, 0, -4.79, 1.45, 200, 0.09, 0.12);
    // ...and a second pavement below the road, at the bottom of the screen.
    b(group, map.id === 'cipo' ? 0xd9d2bd : 0xe3dcc6, 0, -4.83, 11, 200, 0.08, 5);
    b(group, 0xb8b199, 0, -4.79, 8.55, 200, 0.09, 0.12);
  }
  // The road (or promenade / dirt track) in front of the scenery.
  const roadColor = {cipo: 0x4c5d65, rio: 0xe6dcc3, brasilia: 0x939a9e, amazonia: 0xb89b6a};
  let calcadao = null;
  if (map.id === 'rio') {
    // Rio: the whole foreground is the striped promenade, scrolling with the near layer.
    calcadao = calcadaoTexture();
    if (calcadao) {
      const floor = new T.Mesh(
        new T.PlaneGeometry(200, 28.5),
        new T.MeshLambertMaterial({map: calcadao}),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, -4.8, 15.75);
      floor.receiveShadow = true;
      floor.userData.ground = true;
      group.add(floor);
    }
  } else b(group, roadColor[map.id], 0, -5.05, 5, 200, 0.5, 7);
  const far = root(group, 0, 0, -48);
  for (let layer = 0; layer < 3; layer++) {
    const v = new Voxels(0.55);
    for (let j = 0; j < 145; j++) {
      const x = -40 + j * 0.55,
        h = 1.7 + Math.pow(Math.sin(j * 0.12 + layer * 1.7), 2) * 2.8 + Math.sin(j * 0.13) * 0.5;
      v.cube(
        x,
        -6 + h / 2 - layer * 0.2,
        -layer * 5,
        0.55,
        h,
        2,
        [0x488d7b, 0x7db3a0, 0xa4c9b4][layer],
      );
    }
    far.add(v.build());
  }
  if (map.id === 'rio') {
    const cr = root(far, -7, 1.8, 8);
    b(cr, 0xe6e4ce, 0, 0.8, 0, 0.35, 1.9, 0.4);
    b(cr, 0xe6e4ce, 0, 1.9, 0, 0.4, 0.4, 0.4);
    b(cr, 0xe6e4ce, 0, 1.3, 0, 2.3, 0.22, 0.3);
    const cable = root(group, 0, 0, -26);
    b(cable, 0x354d4f, 12, 2.2, 0, 10, 0.05, 0.06, 0.18);
    const car = b(cable, 0xe8b35a, 12, 1.6, 0, 0.65, 0.65, 0.65);
    movers.push({type: 'cable', g: car, base: car.position.clone(), seed: 1});
  }
  if (map.id === 'brasilia') {
    const monument = root(group, 2, 0, -27),
      white = 0xede4cc;
    for (const x of [-2, 0]) {
      b(monument, white, x, -0.2, 0, 1.6, 8.5, 1.7);
      for (let j = 0; j < 12; j++) b(monument, 0x6598ac, x, -3.8 + j * 0.61, 1, 1.4, 0.15, 0.08);
    }
    b(monument, white, -1, -4.2, 0, 17, 0.5, 4);
    for (let j = 0; j < 5; j++) {
      b(monument, white, -7, -3.7 + j * 0.3, 0, 5 - j * 0.75, 0.3, 3.5 - j * 0.35);
      b(monument, white, 6, -3.7 + j * 0.3, 0, 2 + j * 0.75, 0.3, 2 + j * 0.35);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      for (let j = 0; j < 8; j++) {
        const r = 2.7 - Math.sin((j / 8) * Math.PI) * 1.4;
        b(monument, white, 19 + Math.cos(a) * r, -4 + j * 0.6, Math.sin(a) * r, 0.25, 0.7, 0.25);
      }
    }
  }
  const groundRoots = []; // ground decoration: batched apart so it keeps receiving shadows
  for (let k = 0; k < 2; k++) {
    const mid = root(group, k * 70, 0, 0);
    skyline(mid, map.id);
    flowerBeds(mid, map);
    groundRoots.push(groundPatches(mid, map));
    layers.push({g: mid, start: k * 70, speed: 0.43});
    const near = root(group, k * 70, 0, 0);
    for (let i = 0; i < 14; i++) {
      const xx = -34 + i * 5;
      if (map.id === 'cipo') {
        b(near, 0xeee5bf, xx, -4.77, 4.5, 2, 0.05, 0.16);
      } else if (map.id === 'rio') {
        // nothing: the striped promenade texture is the floor here
      } else if (map.id === 'brasilia') {
        b(near, 0xf1efe0, xx, -4.77, 4.5, 2, 0.05, 0.16);
      } else b(near, map.id === 'amazonia' ? 0x397b52 : 0x668a5d, xx, -4.7, 6, 0.6, 0.3, 0.6);
    }
    layers.push({g: near, start: k * 70, speed: 0.85});
  }
  // Birds and flying kites have articulated wings and their own paths.
  for (let i = 0; i < 7; i++) {
    const bird = root(group, -27 + i * 9, 4 + (i % 3), -13 - (i % 2) * 8),
      v = new Voxels(0.16);
    v.cube(0, 0, 0, 0.45, 0.55, 0.3, map.id === 'amazonia' ? 0x253844 : 0xf5edd8);
    v.cube(0.35, 0.13, 0, 0.45, 0.14, 0.14, 0xe7c35e);
    v.cube(0.18, 0.2, 0.18, 0.08, 0.08, 0.06, 0x222c38);
    bird.add(v.build());
    const wings = [];
    for (const s of [-1, 1]) {
      const w = root(bird, 0, 0.05, s * 0.12);
      b(w, map.id === 'amazonia' ? 0x2d4350 : 0xf3e9cf, 0, 0, s * 0.35, 0.35, 0.1, 0.7);
      wings.push(w);
    }
    movers.push({type: 'bird', g: bird, base: bird.position.clone(), wings, seed: i});
  }
  if (map.id === 'cipo' || map.id === 'rio') {
    for (let i = 0; i < 3; i++) {
      const kite = root(group, -8 + i * 11, 6 + i * 0.4, -12);
      b(kite, [0xe8bb42, 0xe27661, 0x9e75c2][i], 0, 0, 0, 0.7, 0.7, 0.05, Math.PI / 4);
      for (let j = 0; j < 7; j++)
        b(kite, 0x4b6987, Math.sin(j) * 0.06, -0.55 - j * 0.2, 0, 0.04, 0.2, 0.04);
      movers.push({type: 'kite', g: kite, base: kite.position.clone(), seed: i});
    }
  }
  enrichWorld(group, map, movers);
  // Bake static boxes into material batches; moving objects and parallax layers stay independent.
  const dynamic = new Set(movers.map(a => a.g)),
    layerRoots = new Set([...layers.map(a => a.g), ...groundRoots]);
  group.updateMatrixWorld(true);
  function batch(root) {
    const bins = new Map(),
      inverse = root.matrixWorld.clone().invert();
    root.traverse(o => {
      if (!o.isMesh || !o.geometry.index || o.material.map) return;
      let p = o;
      while (p && p !== root) {
        if (dynamic.has(p) || (layerRoots.has(p) && p !== root)) return;
        p = p.parent;
      }
      const key = o.material.uuid;
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(o);
    });
    for (const objects of bins.values()) {
      if (objects.length < 3) continue;
      const clones = objects.map(o =>
        o.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld)),
      );
      const geo = mergeGeometries(clones);
      clones.forEach(g => g.dispose());
      if (!geo) continue;
      const merged = new T.Mesh(geo, objects[0].material);
      merged.castShadow = true;
      merged.receiveShadow = true;
      root.add(merged);
      objects.forEach(o => {
        o.geometry.dispose();
        o.removeFromParent();
      });
    }
  }
  layers.forEach(l => batch(l.g));
  groundRoots.forEach(g => batch(g));
  batch(group);
  // Scenery (houses, trees, signs) is lit flat: receiving shadows made roofs and neighbours stripe
  // the walls. Only the ground (and its decoration) shows shadows.
  const groundColors = new Set(
    [map.ground, map.water, roadColor[map.id], 0xd9d2bd, 0xe3dcc6, 0xb8b199].map(c =>
      new T.Color(c).getHex(),
    ),
  );
  group.traverse(o => {
    if (!o.isMesh || !o.material.color) return;
    let onGround = o.userData.ground || groundColors.has(o.material.color.getHex());
    for (let p = o; p && !onGround; p = p.parent) onGround = groundRoots.includes(p);
    o.receiveShadow = onGround;
  });
  return {
    group,
    update(t, dt = 0, playing = false, speed = 5.5) {
      if (playing) distance += dt * speed;
      for (const l of layers) {
        l.g.position.x = ((((l.start - distance * l.speed + 70) % 140) + 140) % 140) - 70;
      }
      far.position.x = -Math.sin(distance / 180) * 4;
      if (calcadao) calcadao.offset.x = (distance * 0.85) / CALCADAO_TILE;
      const sunWarm = (Math.sin(t * 0.018) + 1) * 0.5;
      scene.background.set(map.sky).lerp(new T.Color(0xf2c391), sunWarm * 0.15);
      for (const a of movers) {
        const {g, base, seed} = a;
        if (a.type === 'bird') {
          g.position.x = ((((base.x - t * 0.55 + 40) % 80) + 80) % 80) - 40;
          g.position.y = base.y + Math.sin(t * 1.6 + seed) * 0.5;
          a.wings.forEach((w, i) => (w.rotation.x = Math.sin(t * 8 + seed) * (i ? -0.7 : 0.7)));
        } else if (a.type === 'cloud')
          g.position.x = ((((base.x - t * 0.18 + 50) % 100) + 100) % 100) - 50;
        else if (a.type === 'kite') {
          g.position.y = base.y + Math.sin(t + seed) * 0.5;
          g.rotation.z = Math.sin(t * 0.8 + seed) * 0.2;
        } else if (a.type === 'flag') g.rotation.y = Math.sin(t * 3 + seed) * 0.5;
        else if (a.type === 'bulb')
          g.material.color.setHSL(
            (seed * 0.13 + t * 0.03) % 1,
            0.8,
            Math.sin(t * 4 + seed) > 0.1 ? 0.75 : 0.35,
          );
        else if (a.type === 'arm') g.rotation.z = Math.sin(t * 2 + seed) * 0.65;
        else if (a.type === 'walk') {
          g.position.x = base.x + Math.sin(t * 0.3 + seed) * 2;
          g.position.y = base.y + Math.abs(Math.sin(t * 5)) * 0.08;
          g.rotation.y = Math.cos(t * 0.3 + seed) > 0 ? 0 : Math.PI;
        } else if (a.type === 'bus') g.position.x = ((base.x + t * 1.2 + 32) % 64) - 32;
        else if (a.type === 'ball') {
          g.position.x = base.x + Math.sin(t) * 2.5;
          g.position.y = base.y + Math.abs(Math.sin(t * 2)) * 0.4;
          g.rotation.z = t * 2;
        } else if (a.type === 'smoke') {
          g.position.y = 1.5 + ((t * 0.55 + seed * 0.4) % 2);
          g.position.x = base.x + Math.sin(t + seed) * 0.15;
          g.scale.setScalar(0.5 + ((t * 0.55 + seed * 0.4) % 2) * 0.35);
        } else if (a.type === 'cable') {
          g.position.x = base.x + Math.sin(t * 0.15) * 4;
          g.position.y = base.y + Math.sin(t * 0.15) * 0.7;
        } else if (a.type === 'palm') g.rotation.z = Math.sin(t + seed) * 0.025;
        else if (a.type === 'ripple') {
          g.position.x = base.x + Math.sin(t * 0.7 + seed) * 0.7;
          g.scale.x = 1 + Math.sin(t + seed) * 0.3;
        } else if (a.type === 'capy') g.rotation.y = Math.sin(t * 0.3 + seed) * 0.14;
        else if (a.type === 'croc') {
          g.position.x = base.x + Math.sin(t * 0.2) * 1.5;
          g.position.y = base.y + Math.sin(t) * 0.04;
        }
      }
    },
    get distance() {
      return distance;
    },
  };
}
export function makeGate(scene, map, center, gap, x) {
  const g = new T.Group();
  g.position.x = x;
  scene.add(g);
  const body = mat(map.pipe),
    dark = mat(new T.Color(map.pipe).multiplyScalar(0.74)),
    rim = mat(map.id === 'cipo' ? 0xe0bd76 : 0xe3d188);
  for (const side of [-1, 1]) {
    const edge = center + (side * gap) / 2;
    box(g, body, 0, edge + side * 12, 0, 1.55, 24, 1.55);
    box(g, dark, 0.6, edge + side * 12, 0.81, 0.25, 24, 0.08);
    box(g, rim, 0, edge + side * 0.18, 0, 1.92, 0.36, 1.92);
    for (let j = 0; j < 9; j++)
      box(g, dark, 0, edge + side * (j * 1.2 + 0.85), 0.82, 1.55, 0.08, 0.06);
  }
  return g;
}
export function makeCoin(scene, x, y) {
  const g = new T.Group();
  scene.add(g);
  g.position.set(x, y, 0);
  box(g, mat(0xd99931), 0, 0, 0, 0.43, 0.43, 0.12);
  box(g, mat(0xffdc65), 0, 0, 0.075, 0.31, 0.31, 0.06);
  box(g, mat(0xf8f1a5), -0.06, 0.04, 0.12, 0.08, 0.2, 0.04);
  return g;
}
