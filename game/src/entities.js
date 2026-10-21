import {activePower, effectiveGate, powerFor} from '../core/adventure.js';
import {makeHazard, makeProjectile, makeMotorbike} from './adventure-models.js';
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
    this.obstacles = new Map();
    this.projectiles = new Map();
    this.bike = makeMotorbike();
    this.bike.visible = false;
    stage.scene.add(this.bike);
    this.aura = new T.Mesh(
      new T.TorusGeometry(1.1, 0.045, 4, 24),
      new T.MeshBasicMaterial({color: 0x67eaff, transparent: true, opacity: 0.8}),
    );
    this.aura.visible = false;
    stage.scene.add(this.aura);
  }

  clear() {
    for (const collection of [this.gates, this.tokens, this.obstacles, this.projectiles]) {
      collection.forEach(m => disposeGroup(m));
      collection.clear();
    }
    this.particles.forEach(p => disposeGroup(p.mesh));
    this.particles.length = 0;
    this.bike.visible = this.aura.visible = false;
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
      const model = this.gates.get(g.id);
      model.position.x = playerX + g.x;
      if (g.broken && model.visible)
        this.burst(new T.Vector3(playerX + g.x, g.center, 0), map.pipe, 12);
      model.visible = !g.broken;
      const expanded = effectiveGate(run, g).gap;
      // The gate meshes are built around their original center; shift the two halves apart.
      if (!model.userData.originals)
        model.userData.originals = model.children.map(c => c.position.y);
      model.children.forEach((c, i) => {
        const y = model.userData.originals[i];
        c.position.y = y + (Math.sign(y - g.center) * (expanded - g.gap)) / 2;
      });
    }
    for (const c of run.tokens) {
      if (!this.tokens.has(c.id)) this.tokens.set(c.id, makeCoin(scene, playerX + c.x, c.y));
      this.tokens.get(c.id).position.x = playerX + c.x;
    }
    for (const [data, models, make] of [
      [run.obstacles, this.obstacles, makeHazard],
      [run.projectiles, this.projectiles, makeProjectile],
    ]) {
      const ids = new Set(data.map(o => o.id));
      for (const [id, model] of models)
        if (!ids.has(id)) {
          if (model.position.x > playerX - 2) this.burst(model.position, 0xffc35b, 8);
          disposeGroup(model);
          models.delete(id);
        }
      for (const o of data) {
        if (!models.has(o.id)) {
          const model = make(o.kind);
          scene.add(model);
          models.set(o.id, model);
        }
        const model = models.get(o.id);
        model.position.set(playerX + o.x, o.y, 0);
        model.userData.wings?.forEach(
          (w, i) => (w.rotation.x = Math.sin(run.tick / 12) * (i ? 0.5 : -0.5)),
        );
        if (models === this.projectiles) model.rotation.z = run.tick / 10;
      }
    }
    const kind = activePower(run);
    this.bike.visible = kind === 'bike';
    this.bike.position.set(playerX, run.y - 0.3, 0.25);
    this.aura.visible = !!kind;
    this.aura.position.set(playerX, run.y, 0.7);
    this.aura.material.color.setHex(powerFor(run).color);
    this.aura.rotation.z = run.tick / 50;
    this.aura.scale.setScalar(kind === 'tiny' ? 0.5 : 1 + Math.sin(run.tick / 8) * 0.05);
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
