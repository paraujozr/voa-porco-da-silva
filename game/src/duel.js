import {PIGS} from './config.js';
import {$, toast} from './dom.js';
import {showModal} from './modal.js';

const TICK_RATE = 120;

// Online 1v1 flow: reacts to room snapshots, streams the local run to the server and
// handles forfeits. Mutates `game.duel` (the current room) and drives the game's lifecycle.
export class DuelController {
  constructor(game) {
    this.game = game;
    this.busy = false;
    this.finalPending = false;
    this.departed = new Set();
    setInterval(() => {
      const {duel, state} = this.game;
      if (duel && duel.state === 'racing' && state !== 'countdown') this.send();
    }, 2200);
  }

  handleRoom(room) {
    const g = this.game;
    if (!g.session.uid || this.departed.has(room.code)) return;
    if (room.state === 'cancelled') {
      if (g.duel?.code === room.code) {
        g.duel = null;
        g.home();
      }
      return;
    }
    if (room.state === 'racing' && g.duel?.code !== room.code) {
      g.duel = room;
      g.difficulty = 'normal';
      $('difficulty').value = 'normal';
      g.switchMap(0);
      if (PIGS[g.charIndex].cost && !g.save.unlocked.includes(PIGS[g.charIndex].id)) g.switchPig(0);
      g.prepare({id: room.code, seed: room.seed, level: room.level, mapId: room.mapId}, true);
      g.social?.hide();
      g.setState('countdown');
    }
    if (g.duel?.code === room.code) {
      g.duel = room;
      const rival = Object.entries(room.players).find(([uid]) => uid !== g.session.uid)?.[1];
      $('rival-distance').textContent = rival
        ? `${rival.nickname}: ${rival.distance} canos`
        : 'Aguardando rival';
      if (room.state === 'finished') {
        g.setState('over');
        g.music.stop();
        showModal({
          eyebrow: 'RESULTADO DO DUELO',
          title:
            room.winner === 'draw'
              ? 'Empate na resenha!'
              : room.winner === g.session.uid
                ? 'Você venceu!'
                : 'O rival voou mais!',
          text: Object.values(room.players)
            .map(p => `${p.nickname}: ${p.distance} canos`)
            .join(' • '),
          note: 'Abra Duelo no menu para criar outra sala.',
        });
      }
    }
  }

  async send(final = false) {
    const g = this.game;
    if (!g.duel || !['racing', 'finished'].includes(g.duel.state)) return;
    if (this.busy) {
      this.finalPending ||= final;
      return;
    }
    this.busy = true;
    try {
      const data = {code: g.duel.code};
      if (g.run && g.duel.state === 'racing' && (g.state === 'playing' || final)) {
        Object.assign(data, {inputs: [...g.inputs], ticks: g.run.tick, quit: final});
      }
      const out = await g.session.call('duelTick', data);
      if (g.duel?.code === data.code) this.handleRoom(out.room);
    } catch (e) {
      toast('Duelo: ' + e.message);
    } finally {
      this.busy = false;
      if (this.finalPending) {
        this.finalPending = false;
        this.send(true);
      }
    }
  }

  forfeit() {
    const g = this.game;
    if (!g.duel || !g.run) return;
    g.run.dead = true;
    g.run.reason = 'quit';
    if (g.state === 'playing') g.end();
    else this.send(true);
  }

  async leave() {
    const g = this.game;
    const code = g.duel.code;
    await g.session.call('leaveRoom', {code});
    this.departed.add(code);
    g.social?.releaseRoom();
    g.duel = null;
  }

  // Tick the run is expected to be at, given the server-synchronised start time.
  targetTick() {
    const g = this.game;
    return Math.max(0, Math.floor(((g.session.now() - g.duel.startAt) * TICK_RATE) / 1000));
  }
}
