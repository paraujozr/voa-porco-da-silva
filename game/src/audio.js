export class AudioSystem {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
  }
  unlock() {
    if (this.muted) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch {}
  }
  fahh() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const c = this.ctx,
      t = c.currentTime,
      d = 0.85;
    const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate),
      data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = b;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + d);
    filter.Q.value = 0.8;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.001, t + d);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start(t);
    noise.stop(t + d);
    for (const freq of [110, 220, 660]) {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, t + 0.1);
      o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + d);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.018, t + 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + d);
    }
  }
  play(type) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx,
      t = ctx.currentTime,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const tones = {
      flap: [260, 420, 0.09, 0.04],
      coin: [700, 1100, 0.17, 0.07],
      hit: [160, 45, 0.3, 0.07],
      select: [480, 650, 0.08, 0.035],
      score: [600, 900, 0.2, 0.05],
    };
    const [a, b, d, v] = tones[type] || tones.select;
    o.type = type === 'hit' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(a, t);
    o.frequency.exponentialRampToValueAtTime(b, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.start(t);
    o.stop(t + d);
  }
}
