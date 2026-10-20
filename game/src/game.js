import * as T from 'three';
import {MAPS, PIGS, MEMES} from './config.js';
import {DIFFICULTY_NAMES} from './difficulty.js';
import {
  createRun,
  advance,
  revive,
  continuePrice,
  DT,
  MAX_TICKS,
  SOLO_SECONDS,
  LEVELS,
} from '../core/engine.js';
import {animatePig} from './animation.js';
import {makePig, disposeGroup} from './pig.js';
import {buildWorld} from './world.js';
import {$, toast} from './dom.js';
import {RunEntities} from './entities.js';
import {renderMenu, bestRecord, isOwned} from './menu-ui.js';
import {showModal} from './modal.js';
import {DuelController} from './duel.js';
import {buildMenuProp} from './menu-scene.js';
import {icon} from './icons.js';
import {takeoffPose, viewPose, DEFAULT_VIEW, TAKEOFF_SECONDS} from './takeoff.js';

// The menu set piece stands on the road in front of the camera.
const MENU_Z = 4;
const ROAD_Y = -4.8;
// The pig is the same size in the menu and in flight: only the camera moves.
const PIG_SCALE = 0.68;
// The pig sits this far behind its flight position (world units): taking off is a hop forward.
const TAKEOFF_RUN = 3.2;

// Values double as <body> class names (see the CSS), so keep them stable.
export const STATE = {
  MENU: 'menu',
  TAKEOFF: 'takeoff',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  OVER: 'over',
};

// Owns the game's mutable state: menu selection, the active run and its server ticket,
// and the frame loop. Rendering details live in Stage/RunEntities, rules in core/engine.js.
export class Game {
  constructor({session, stage, audio, music}) {
    this.session = session;
    this.stage = stage;
    this.audio = audio;
    this.music = music;
    this.entities = new RunEntities(stage);
    this.duelCtl = new DuelController(this);
    this.save = session.data;
    this.social = null;

    this.state = STATE.MENU;
    this.mapIndex = 0;
    this.charIndex = 0;
    this.difficulty = 'normal';
    this.world = null;
    this.pig = null;
    this.prop = null; // the menu set piece the pig sits on
    this.takeoff = null; // menu -> flight hop in progress

    this.run = null; // engine state of the current flight
    this.ticket = null; // server/guest receipt for the current flight
    this.inputs = []; // ticks at which the player flapped (replayed by the server)
    this.pendingFlap = false;
    this.settlement = null; // in-flight promise saving the finished run
    this.busy = false;
    this.duel = null; // current room snapshot while in a 1v1

    this.time = 0;
    this.last = performance.now();
    this.accumulator = 0;
    this.flapPulse = 0;
    this.dance = 0;
    this.fireworkTimer = 0;
    this.animate = this.animate.bind(this);
  }

  // ---- bootstrap ----
  start() {
    this.switchMap(0);
    this.switchPig(0);
    this.applyQuality();
    this.setState(STATE.MENU);
  }

  begin() {
    $('loading').remove();
    requestAnimationFrame(this.animate);
  }

  // ---- state & menu ----
  setState(next) {
    this.state = next;
    const inMenuScene = [STATE.MENU, STATE.TAKEOFF].includes(next);
    // The prop stays up when a run starts so it can scroll away with the scenery (tickScene).
    if (this.prop && next !== STATE.PLAYING) this.prop.group.visible = inMenuScene;
    if (!inMenuScene) this.stage.setView(DEFAULT_VIEW);
    document.body.className = next;
    // The menu stays up during the takeoff so its parts can slide out (see menu.css).
    $('menu').hidden = ![STATE.MENU, STATE.TAKEOFF].includes(next);
    $('hud').hidden = next === STATE.MENU;
    $('modal').hidden = ![STATE.PAUSED, STATE.OVER].includes(next);
    $('countdown').hidden = next !== STATE.COUNTDOWN;
    $('pause').innerHTML = this.duel ? 'SAIR DO DUELO' : `${icon('pause')} PAUSAR`;
  }

  applyQuality() {
    this.stage.setQuality(this.save.low);
    $('quality').textContent = this.save.low ? '3D LEVE' : '3D ALTO';
  }

  refreshUI() {
    renderMenu(this);
  }

  bestRecord() {
    return bestRecord(this.save, MAPS[this.mapIndex], this.difficulty);
  }

  switchMap(index) {
    this.mapIndex = index;
    if (this.world) disposeGroup(this.world.group);
    this.world = buildWorld(this.stage.scene, MAPS[index]);
    if (this.prop) disposeGroup(this.prop.group);
    this.prop = buildMenuProp(MAPS[index].id);
    this.prop.group.visible = this.state === STATE.MENU;
    this.stage.scene.add(this.prop.group);
    this.refreshUI();
  }

  switchPig(index) {
    this.charIndex = index;
    if (this.pig) disposeGroup(this.pig);
    this.pig = makePig(PIGS[index]);
    this.stage.scene.add(this.pig);
    this.refreshUI();
  }

  // ---- run lifecycle ----
  clearRun() {
    this.entities.clear();
  }

  prepare(ticket, duelMode = false) {
    this.clearRun();
    this.ticket = ticket;
    this.run = createRun(ticket.seed, ticket.level, duelMode);
    this.inputs = [];
    this.pendingFlap = false;
    this.settlement = null;
    this.accumulator = 0;
    this.dance = 0;
    $('six-seven').hidden = true;
    this.flapPulse = 0;
    this.pig.scale.setScalar(0.68);
    this.pig.rotation.set(0, 0.2, 0);
    this.pig.visible = true;
    $('score').textContent = '0';
    $('run-coins').textContent = '0';
    $('flight-map').textContent =
      `${MAPS[this.mapIndex].name} · ${DIFFICULTY_NAMES[this.difficulty]}`;
    $('rival-distance').hidden = !duelMode;
    this.music.theme();
    this.audio.unlock();
    document.activeElement?.blur();
  }

  async startFlight() {
    if (this.busy) return;
    if (this.social?.hasRoom()) {
      this.social.showRoom();
      toast('Saia da sala antes de iniciar um voo solo.');
      return;
    }
    this.audio.unlock();
    this.music.unlock();
    this.busy = true;
    $('play').disabled = true;
    $('retry').disabled = true;
    try {
      if (this.settlement) await this.settlement;
      const map = MAPS[this.mapIndex],
        data = PIGS[this.charIndex],
        kind = isOwned(this.save, 'map', map) ? 'skin' : 'map',
        item = kind === 'map' ? map : data;
      if (!isOwned(this.save, kind, item)) {
        toast(`Libere ${item.name} para voar.`);
        this.openPanel(kind === 'map' ? 'maps-panel' : 'porcos-panel');
        return;
      }
      this.duel = null;
      // From the menu the pig hops off its seat while the ticket is fetched; from the game-over
      // screen (retry) there is nothing to hop from, so go straight in.
      if (this.state === STATE.MENU) {
        this.beginTakeoff(this.session.begin(map.id, data.id, this.difficulty));
        return;
      }
      this.prepare(await this.session.begin(map.id, data.id, this.difficulty));
      this.setState(STATE.PLAYING);
      this.audio.play('flap');
    } catch (e) {
      toast(e.message);
    } finally {
      this.busy = false;
      $('play').disabled = false;
      $('retry').disabled = false;
    }
  }

  // ---- dialogs & shop ----
  openPanel(id) {
    $(id).hidden = false;
    $(id).querySelector('.close-btn, button')?.focus();
  }

  closePanel(id) {
    $(id).hidden = true;
  }

  // Closes the topmost open dialog (menu or social). Returns whether one was open.
  closeOpenDialog() {
    const open = [...document.querySelectorAll('.dialog')].filter(d => !d.hidden);
    const top = open.at(-1);
    if (!top) return false;
    top.querySelector('.close-btn')?.click();
    return true;
  }

  async buy(item, kind) {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.session.buy(item, kind);
      toast(`${item.name} liberado!`);
    } catch (e) {
      toast(e.message);
    } finally {
      this.busy = false;
      this.refreshUI();
    }
  }

  async pigAction() {
    const pig = PIGS[this.charIndex];
    if (isOwned(this.save, 'skin', pig)) this.closePanel('porcos-panel');
    else await this.buy(pig, 'skin');
  }

  async mapAction() {
    const map = MAPS[this.mapIndex];
    if (isOwned(this.save, 'map', map)) this.closePanel('maps-panel');
    else await this.buy(map, 'map');
  }

  beginTakeoff(ticketPromise) {
    const {pig, stage} = this;
    const takeoff = {
      t: 0,
      ticket: null,
      error: null,
      from: {
        x: pig.position.x,
        y: pig.position.y,
        z: pig.position.z,
        scale: pig.scale.x,
        yaw: pig.rotation.y,
      },
      view: {...stage.view},
      seconds: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.2 : TAKEOFF_SECONDS,
    };
    this.takeoff = takeoff;
    ticketPromise.then(
      ticket => (takeoff.ticket = ticket),
      error => (takeoff.error = error),
    );
    pig.visible = true;
    this.setState(STATE.TAKEOFF);
    this.audio.play('flap');
  }

  // The camera zooms out from the close-up on the bench to the gameplay framing while the pig
  // hops off its seat and flies to its flight position: as if the run starts inside the scene.
  tickTakeoff(dt) {
    const k = this.takeoff;
    if (!k) return;
    k.t += dt;
    if (k.error) {
      toast(k.error.message);
      this.takeoff = null;
      this.setState(STATE.MENU);
      return;
    }
    const progress = Math.min(1, k.t / k.seconds);
    const pose = takeoffPose(
      k.from,
      {x: this.stage.playerX, y: 1, z: 0, scale: PIG_SCALE, yaw: 0.2},
      progress,
      2,
    );
    this.pig.position.set(pose.x, pose.y, pose.z);
    this.pig.scale.setScalar(pose.scale);
    this.pig.rotation.set(0.02 * (1 - progress), pose.yaw, 0);
    this.stage.setView(viewPose(k.view, DEFAULT_VIEW, progress));
    this.flapPulse = 1; // wings beat hard while hopping off
    if (progress >= 1 && k.ticket) {
      this.takeoff = null;
      this.prepare(k.ticket);
      this.setState(STATE.PLAYING);
    }
  }

  async settle(quit = false) {
    if (!this.run || !this.ticket || this.duel) return;
    this.settlement = this.session.settle(this.ticket, this.run, [...this.inputs], quit);
    return this.settlement;
  }

  updateContinue() {
    const {run, save} = this;
    const allowed = run && !this.duel && run.dead && run.reason !== 'limit' && run.continues < 3;
    $('continue-run').hidden = !allowed;
    if (allowed) {
      const price = continuePrice(run.continues);
      $('continue-run').innerHTML = `CONTINUAR · ${price} ${icon('coin')}`;
      $('continue-run').disabled = save.coins < price;
      $('continue-note').textContent =
        save.coins < price
          ? `Faltam ${price - save.coins} moedas.`
          : '1,5 s de proteção. Voos com continue não entram no ranking global.';
    } else
      $('continue-note').textContent = this.duel
        ? 'No duelo, não há continue. Aguarde o outro jogador.'
        : '';
  }

  async end() {
    if (this.state !== STATE.PLAYING) return;
    const {run, duel} = this;
    this.setState(STATE.OVER);
    if (run.reason === 'limit') this.music.stop();
    else this.music.fail();
    showModal({
      eyebrow: duel ? 'DUELO EM ANDAMENTO' : 'POUSO NÃO PROGRAMADO',
      title: run.reason === 'limit' ? 'Voo concluído!' : 'Deu ruim, parceiro!',
      text:
        run.reason === 'limit' && !duel
          ? `Sessão de ${SOLO_SECONDS / 60} minutos concluída: ${run.passed} canos. Seu resultado será salvo; você pode começar outro voo.`
          : `${this.save.nickname}, você atravessou ${run.passed} canos.`,
      results: true,
      retry: !duel,
      note: duel ? 'Aguardando o resultado do duelo…' : 'Salvando a partida…',
    });
    $('result-score').textContent = run.passed;
    $('result-coins').textContent = run.coins;
    $('result-best').textContent = this.bestRecord();
    this.entities.burst(this.pig.position, 0xf5b3a9, 16);
    if (duel) {
      await this.duelCtl.send(true);
      return;
    }
    try {
      await this.settle();
      $('result-best').textContent = this.bestRecord();
      this.updateContinue();
    } catch (e) {
      $('continue-note').textContent =
        'Não foi possível salvar. Voltar ou tentar novamente fará uma nova tentativa.';
      this.settlement = null;
      this.ticket.needsSettle = true;
      toast(e.message);
    }
  }

  async continueRun() {
    if (this.busy || this.state !== STATE.OVER || !this.run?.dead || this.duel) return;
    this.busy = true;
    $('continue-run').disabled = true;
    try {
      if (this.settlement) await this.settlement;
      await this.session.continue(this.ticket, this.run);
      revive(this.run);
      this.syncEntities();
      this.settlement = null;
      this.accumulator = 0;
      this.pendingFlap = false;
      this.pig.rotation.set(0, 0.2, 0);
      this.pig.visible = true;
      this.music.theme();
      this.setState(STATE.PLAYING);
      document.activeElement?.blur();
      toast('Bora! Proteção por 1,5 segundo.');
    } catch (e) {
      toast(e.message);
    } finally {
      this.busy = false;
      if (this.state === STATE.OVER) this.updateContinue();
    }
  }

  pause() {
    if (this.state !== STATE.PLAYING) return;
    if (this.duel) {
      this.duelCtl.forfeit();
      return;
    }
    this.setState(STATE.PAUSED);
    this.music.pause();
    showModal({
      eyebrow: 'PAUSA PRA RESENHA',
      title: 'Asinhas descansando.',
      text: 'Continue quando estiver pronto.',
      resume: true,
    });
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.accumulator = 0;
    this.music.theme();
    this.setState(STATE.PLAYING);
    document.activeElement?.blur();
  }

  // Leave the current flight/duel and go back to the menu.
  async home() {
    if (this.busy) return;
    this.busy = true;
    try {
      if (this.duel) {
        await this.duelCtl.leave();
      } else if (this.run && [STATE.PLAYING, STATE.PAUSED].includes(this.state)) {
        await this.settle(true);
      } else if (this.ticket?.needsSettle) {
        await this.settle();
        this.ticket.needsSettle = false;
      } else if (this.settlement) {
        await this.settlement;
      }
      this.music.stop();
      this.clearRun();
      this.run = null;
      this.ticket = null;
      this.settlement = null;
      this.dance = 0;
      $('six-seven').hidden = true;
      this.setState(STATE.MENU);
      this.refreshUI();
    } catch (e) {
      toast(e.message);
    } finally {
      this.busy = false;
    }
  }

  retry() {
    if (this.ticket?.needsSettle) {
      this.settlement = this.settle();
      this.ticket.needsSettle = false;
    }
    this.startFlight();
  }

  flap() {
    if (this.state !== STATE.PLAYING) return;
    this.pendingFlap = true;
    this.flapPulse = 1;
    this.audio.play('flap');
  }

  toggleSound() {
    const {save, session} = this;
    save.muted = !save.muted;
    this.audio.muted = save.muted;
    this.music.mute(save.muted);
    if (!save.muted && this.state === STATE.PLAYING) this.music.theme();
    if (!session.user) session.saveGuest();
    this.refreshUI();
  }

  toggleQuality() {
    this.save.low = !this.save.low;
    this.applyQuality();
    if (!this.session.user) this.session.saveGuest();
  }

  celebrate() {
    this.dance = 3.8;
    this.fireworkTimer = 0;
    $('six-seven').hidden = false;
    this.music.sixSeven?.();
    toast('67 canos! SIX SEVEN!');
  }

  syncEntities() {
    this.entities.sync(this.run, MAPS[this.mapIndex]);
  }

  // ---- simulation & frame loop ----
  step() {
    const {run} = this;
    if (!this.duel && run.tick === MAX_TICKS - 120 * 60)
      toast('Falta 1 minuto para concluir esta sessão. Seu resultado será salvo.');
    if (this.pendingFlap) {
      this.inputs.push(run.tick);
    }
    const beforeCoins = run.coins,
      beforePassed = run.passed;
    const result = advance(run, this.pendingFlap);
    this.pendingFlap = false;
    if (run.coins > beforeCoins) this.audio.play('coin');
    if (run.passed > beforePassed && run.passed % 3 === 0) toast(MEMES[run.passed % MEMES.length]);
    $('score').textContent = run.passed;
    $('run-coins').textContent = run.coins;
    if (result.sixSeven) this.celebrate();
    if (result.dead) this.end();
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (this.state === STATE.COUNTDOWN) this.tickCountdown();
    if (this.state === STATE.TAKEOFF) this.tickTakeoff(dt);
    if (this.state === STATE.PLAYING && this.run) this.tickFlight(dt);
    if (this.state !== STATE.PAUSED) this.tickScene(dt);
    if (this.state === STATE.MENU) this.tickMenuPig();
    this.stage.render();
  }

  tickCountdown() {
    const seconds = Math.ceil((this.duel.startAt - this.session.now()) / 1000);
    $('countdown').textContent = seconds > 0 ? seconds : 'VOA!';
    if (seconds <= 0) {
      this.setState(STATE.PLAYING);
      this.music.theme();
    }
  }

  tickFlight(dt) {
    const {run, pig} = this;
    if (this.duel) {
      // Duels are clocked by the server: catch up to the tick the shared start time implies.
      const target = this.duelCtl.targetTick();
      if (target - run.tick > 1200) {
        this.duelCtl.forfeit();
      } else {
        let budget = 600;
        while (run.tick < target && this.state === STATE.PLAYING && budget-- > 0) this.step();
      }
    } else {
      this.accumulator += dt;
      while (this.accumulator >= DT && this.state === STATE.PLAYING) {
        this.step();
        this.accumulator -= DT;
      }
    }
    this.syncEntities();
    pig.position.set(this.stage.playerX, run.y, 0);
    pig.visible = !run.shield || Math.floor(this.time * 12) % 2 === 0;
  }

  tickScene(dt) {
    const {run} = this;
    this.time += dt;
    this.world.update(
      this.time,
      dt,
      this.state === STATE.PLAYING,
      run ? LEVELS[run.level].speed + Math.min(run.passed * 0.04, LEVELS[run.level].boost) : 0,
    );
    this.driftProp(
      dt,
      run ? LEVELS[run.level].speed + Math.min(run.passed * 0.04, LEVELS[run.level].boost) : 0,
    );
    this.flapPulse = Math.max(0, this.flapPulse - dt * 4);
    animatePig(this.pig, {
      time: this.time,
      dt,
      state: this.state,
      velocity: run?.v || 0,
      pulse: this.flapPulse,
      dance: this.dance,
      sit: this.state === STATE.MENU ? 1 : 0,
    });
    if (this.state === STATE.MENU) this.prop.update(this.time);
    if (this.dance > 0) {
      this.dance -= dt;
      this.fireworkTimer -= dt;
      if (this.fireworkTimer <= 0) {
        this.fireworkTimer = 0.24;
        this.entities.burst(
          new T.Vector3(
            (Math.random() - 0.5) * this.stage.halfWidth * 1.3,
            3 + Math.random() * 4,
            1,
          ),
          [0xffdf00, 0x50e3c2, 0xff71ab][Math.floor(Math.random() * 3)],
          18,
        );
      }
      if (this.dance <= 0) $('six-seven').hidden = true;
    }
    this.entities.update(dt);
  }

  // After takeoff the menu prop is part of the scenery: it scrolls off to the left like the near
  // layer does, then disappears.
  driftProp(dt, speed) {
    const {prop, stage} = this;
    if (this.state !== STATE.PLAYING || !prop.group.visible) return;
    prop.group.position.x -= speed * 0.85 * dt;
    if (prop.group.position.x < -(stage.halfWidth + prop.width * PIG_SCALE))
      prop.group.visible = false;
  }

  // World x of the menu seat: behind the pig's flight position, so takeoff moves it forward.
  menuSeatX() {
    return this.stage.playerX - TAKEOFF_RUN;
  }

  // Menu camera: a close-up of the pig and its prop standing on the real road, framed between the
  // top bar and the name bar. The pig sits at the same screen position it has in flight, so the
  // zoom-out never drags it backwards across the screen; zoom is as tight as the free area allows.
  menuView() {
    const {stage, prop} = this;
    const unit = innerHeight / 20;
    const top = $('top').getBoundingClientRect().bottom + 8;
    const bottom = document.querySelector('.menu-bottom').getBoundingClientRect().top - 14;
    const propH = prop.height * PIG_SCALE,
      propHalf = (prop.width * PIG_SCALE) / 2;
    // The pig is left of centre (like in flight): keep the prop's left edge on screen.
    const lead = Math.abs(stage.playerX) / stage.halfWidth;
    const leftLimit = innerWidth <= 680 ? 1.15 : 0.9;
    const fit = Math.min(
      (bottom - top) / (propH * unit * 1.05),
      ((leftLimit - lead) * stage.halfWidth) / propHalf,
    );
    const zoom = Math.min(3.4, Math.max(1.2, fit));
    const view = {zoom, x: this.menuSeatX() - stage.playerX / zoom, y: DEFAULT_VIEW.y};
    // Slide the camera until the road meets the bottom of the free area.
    for (let i = 0; i < 3; i++) {
      stage.setView(view);
      view.y -= (stage.screenY(0, ROAD_Y, MENU_Z) - bottom) / (unit * view.zoom * 0.99);
    }
    return view;
  }

  // Seats the pig on the map's prop and frames them.
  tickMenuPig() {
    const {pig, prop, time, stage} = this;
    stage.setView(this.menuView());
    const seatX = this.menuSeatX();
    prop.group.scale.setScalar(PIG_SCALE);
    prop.group.position.set(seatX - prop.seat.x * PIG_SCALE, ROAD_Y, MENU_Z);
    pig.visible = prop.group.visible;
    pig.scale.setScalar(PIG_SCALE);
    // The pig's bottom sits about 1.03 below its origin.
    pig.position.set(
      seatX,
      ROAD_Y + (prop.seat.y + 1.03) * PIG_SCALE,
      MENU_Z + prop.seat.z * PIG_SCALE,
    );
    pig.rotation.set(0.02, 0.24 + Math.sin(time * 0.6) * 0.08, 0.03);
  }
}
