import {RULES_VERSION} from '../core/adventure.js';
import {loadGuestProfile, saveGuestProfile} from './guest-profile.js';
import {nickname, credit, continuePrice} from '../core/engine.js';
import {CloudTransport} from './transport.js';
export class Session {
  constructor(storage, {url = '', onChange = () => {}} = {}) {
    this.storage = storage;
    this.onChange = onChange;
    this.user = null;
    this.identity = null;
    this.offset = 0;
    this.guest = this.loadGuest();
    this.data = this.guest;
    this.accountReady = false;
    this.cloudError = '';
    this.cloud = new CloudTransport(url, storage, p => {
      if (this.user) this.adopt(p);
    });
    this.configured = !!this.cloud.url;
  }
  loadGuest() {
    return loadGuestProfile(this.storage);
  }
  saveGuest() {
    saveGuestProfile(this.storage, this.data);
    this.guest = this.data;
  }
  changed() {
    this.onChange(this.data);
  }
  adopt(p) {
    this.data = {...p, muted: this.data.muted, low: this.data.low};
    this.changed();
  }

  get uid() {
    return this.identity?.uid;
  }
  init() {
    return (this.initializing ||= this.initialize());
  }
  async initialize() {
    if (!this.configured || !this.cloud.token) return;
    try {
      this.accept(await this.cloud.call('me'));
    } catch (e) {
      if (e.code === 'unauthenticated') this.cloud.clear();
      else this.cloudError = e.message;
      this.changed();
    }
  }
  accept(result) {
    this.identity = result.user;
    this.user = result.user.guest ? null : result.user;
    this.accountReady = !!this.user;
    this.cloudError = '';
    if (this.user) this.adopt(result.profile);
    else this.changed();
    this.cloud.connect();
  }
  async login(username, password, mode = 'login', recovery = '') {
    await this.init();
    if (!this.configured)
      throw Error('Servidor online ainda não publicado. Jogar Rápido continua disponível.');
    const result = await this.cloud.call(mode, {username, password, recovery}, false);
    this.cloud.save(result.token);
    this.accept(result);
    return result;
  }
  async logout() {
    await this.cloud.call('logout');
    this.cloud.clear();
    this.identity = null;
    this.user = null;
    this.accountReady = false;
    this.data = this.loadGuest();
    this.changed();
  }
  async ensureGuest() {
    await this.init();
    if (this.identity) return;
    if (!this.configured) throw Error('Servidor online ainda não publicado.');
    if (this.creatingGuest) return this.creatingGuest;
    this.creatingGuest = (async () => {
      const result = await this.cloud.call('guest', {nickname: this.data.nickname}, false);
      this.cloud.save(result.token);
      this.accept(result);
    })();
    try {
      await this.creatingGuest;
    } finally {
      this.creatingGuest = null;
    }
  }
  async call(name, data = {}) {
    await this.ensureGuest();
    const begin = Date.now();
    let result;
    try {
      result = await this.cloud.call(name, {...data, rules: RULES_VERSION});
    } catch (e) {
      if (e.code === 'unauthenticated') {
        this.cloud.clear();
        this.identity = null;
        this.user = null;
        this.accountReady = false;
        this.data = this.loadGuest();
        this.changed();
      }
      throw e;
    }
    if (result.serverNow) this.offset = result.serverNow - (begin + Date.now()) / 2;
    return result;
  }
  now() {
    return Date.now() + this.offset;
  }
  async name(value) {
    const n = nickname(value);
    if (this.user) {
      this.adopt(await this.call('setNickname', {nickname: n}));
    } else {
      if (this.identity) await this.call('setNickname', {nickname: n});
      this.data.nickname = n;
      this.saveGuest();
      this.changed();
    }
  }
  async buy(item, kind) {
    if (kind === 'map') throw Error('Conclua o mapa anterior na campanha.');
    await this.init();
    if (this.user) {
      this.adopt(await this.call('buyItem', {id: item.id, kind}));
      return;
    }
    const key = kind === 'map' ? 'maps' : 'unlocked';
    if (!item.cost || this.data[key].includes(item.id)) return;
    if (this.data.coins < item.cost) throw Error('Moedas insuficientes.');
    this.data.coins -= item.cost;
    this.data[key].push(item.id);
    this.saveGuest();
    this.changed();
  }
  async begin(mapId, skinId, level, mode = 'campaign') {
    await this.init();
    if (this.user) {
      if (!this.accountReady) throw Error('Aguarde o perfil carregar.');
      return this.call('beginRun', {mapId, skinId, level, mode});
    }
    return {
      id: crypto.randomUUID(),
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      level,
      mapId,
      skinId,
      mode,
      rules: RULES_VERSION,
    };
  }
  async settle(ticket, run, inputs, quit = false) {
    if (this.user) {
      const out = await this.call('settleRun', {
        runId: ticket.id,
        inputs,
        ticks: run.tick,
        powers: run.powerInputs || [],
        quit,
      });
      this.adopt(out.profile);
      return out.result;
    }
    if (ticket.paidTick === run.tick) return;
    this.data = credit(
      this.data,
      {...run, mapId: ticket.mapId},
      ticket.paidCoins || 0,
      !ticket.counted,
    );
    ticket.paidCoins = run.coins;
    ticket.paidTick = run.tick;
    ticket.counted = true;
    this.saveGuest();
    this.changed();
    return {distance: run.passed};
  }
  async continue(ticket, run) {
    if (this.user) {
      const result = await this.call('continueRun', {runId: ticket.id, tick: run.tick});
      this.adopt(result.profile);
    } else {
      const cost = continuePrice(run.continues);
      if (this.data.coins < cost) throw Error('Moedas insuficientes.');
      this.data.coins -= cost;
      this.saveGuest();
      this.changed();
    }
  }

  board(level, next, error) {
    let cancelled = false,
      unsub;
    this.ensureGuest()
      .then(() => {
        if (!cancelled) unsub = this.cloud.watch('board', level, next, error);
      })
      .catch(e => error(e.message));
    return () => {
      cancelled = true;
      unsub?.();
    };
  }
  watchRoom(code, next, error) {
    return this.cloud.watch('room', code, next, error);
  }
}
