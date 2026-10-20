import * as T from 'three';
import {disposeGroup, mat, ball} from './pig.js';
import {makeGate, makeCoin} from './world.js';

// Meshes mirroring the engine's gates and coins, plus transient particles.
export class RunEntities {
  constructor(stage) {
    this.stage = stage;
    this.gates = new Map();
    this.tokens = new Map();
    this.particles = [];
  }

  clear() {
    for (const collection of [this.gates, this.tokens]) {
      collection.forEach(m => disposeGroup(m));
      collection.clear();
    }
    this.particles.forEach(p => disposeGroup(p.mesh));
    this.particles.length = 0;
  }

  burst(pos, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const m = ball(
        this.stage.scene,
        mat(color),
        pos.x,
        pos.y,
        pos.z,
        0.06 + Math.random() * 0.06,
      );
      this.particles.push({
        mesh: m,
        v: new T.Vector3((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 4),
        life: 0.9,
      });
    }
  }

  // Create/remove/move meshes so they match the engine state in `run`.
  sync(run, map) {
    const {scene, playerX} = this.stage;
    const gids = new Set(run.gates.map(g => g.id)),
      tids = new Set(run.tokens.map(c => c.id));
    for (const [id, m] of this.gates)
      if (!gids.has(id)) {
        disposeGroup(m);
        this.gates.delete(id);
      }
    for (const [id, m] of this.tokens)
      if (!tids.has(id)) {
        if (m.position.x > playerX - 1.5) this.burst(m.position, 0xffde63, 4);
        disposeGroup(m);
        this.tokens.delete(id);
      }
    for (const g of run.gates) {
      if (!this.gates.has(g.id))
        this.gates.set(g.id, makeGate(scene, map, g.center, g.gap, playerX + g.x));
      this.gates.get(g.id).position.x = playerX + g.x;
    }
    for (const c of run.tokens) {
      if (!this.tokens.has(c.id)) this.tokens.set(c.id, makeCoin(scene, playerX + c.x, c.y));
      this.tokens.get(c.id).position.x = playerX + c.x;
    }
  }

  update(dt) {
    this.tokens.forEach(c => (c.rotation.y += dt * 2));
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.v, dt);
      p.v.y -= 5 * dt;
      p.mesh.scale.setScalar(Math.max(0, p.life / 0.9));
      if (p.life <= 0) {
        disposeGroup(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
