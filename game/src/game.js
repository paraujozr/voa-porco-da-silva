import * as T from 'three';
import {MAPS, PIGS, MEMES} from './config.js';
import {DIFFICULTY_NAMES} from './difficulty.js';
import {createRun, advance, revive, continuePrice, DT, LEVELS} from '../core/engine.js';
import {animatePig} from './animation.js';
import {makePig, disposeGroup} from './pig.js';
import {buildWorld} from './world.js';
import {$, toast} from './dom.js';
import {RunEntities} from './entities.js';
import {renderMenu, bestRecord} from './menu-ui.js';
import {showModal} from './modal.js';
import {DuelController} from './duel.js';

// Values double as <body> class names (see the CSS), so keep them stable.
export const STATE = {
  MENU: 'menu',
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
    document.body.className = next;
    $('menu').hidden = next !== STATE.MENU;
    $('hud').hidden = next === STATE.MENU;
    $('modal').hidden = ![STATE.PAUSED, STATE.OVER].includes(next);
    $('countdown').hidden = next !== STATE.COUNTDOWN;
    $('pause').textContent = this.duel ? 'SAIR DO DUELO' : 'Ⅱ PAUSAR';
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
        kind = map.cost && !this.save.maps.includes(map.id) ? 'map' : 'skin',
        item = kind === 'map' ? map : data;
      if (item.cost && !(kind === 'map' ? this.save.maps : this.save.unlocked).includes(item.id)) {
        await this.session.buy(item, kind);
        toast(`${item.name} liberado!`);
        return;
      }
      this.duel = null;
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
      $('continue-run').textContent = `CONTINUAR · ${price} ◉`;
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
    this.music.fail();
    showModal({
      eyebrow: duel ? 'DUELO EM ANDAMENTO' : 'POUSO NÃO PROGRAMADO',
      title: run.reason === 'limit' ? 'Voo concluído!' : 'Deu ruim, parceiro!',
      text: `${this.save.nickname}, você atravessou ${run.passed} canos.`,
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
    this.flapPulse = Math.max(0, this.flapPulse - dt * 4);
    animatePig(this.pig, {
      time: this.time,
      dt,
      state: this.state,
      velocity: run?.v || 0,
      pulse: this.flapPulse,
      dance: this.dance,
    });
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

  // Idle showcase pose for the selected pig, fitted into the free area above the menu card.
  tickMenuPig() {
    const {pig, time} = this;
    const {halfWidth} = this.stage;
    const compact = innerWidth <= 680,
      freeTop = 125,
      freeBottom = document.querySelector('.intro').getBoundingClientRect().top - 8,
      region = Math.max(0, freeBottom - freeTop);
    pig.visible = !compact || region > 55;
    pig.scale.setScalar(compact ? Math.min(1.25, ((region / innerHeight) * 20) / 3.8) : 1.85);
    const menuY = 1 + (0.5 - (freeTop + freeBottom) / 2 / innerHeight) * 20 + 0.6;
    pig.position.set(
      compact ? 0 : halfWidth * 0.48,
      compact ? menuY : 2 + Math.sin(time * 2) * 0.13,
      4,
    );
    pig.rotation.set(0.02, 0.24 + Math.sin(time * 0.6) * 0.16, 0.03);
  }
}
