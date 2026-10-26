/* =========================================================
   Playroom - audio.js
   Tiny Web Audio helper. Every sound is synthesised: soft
   sine/triangle tones with short envelopes. No audio files.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};

  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let master = null;
  let muted = false;
  let voices = 0;
  const MAX_VOICES = 28;

  // C major pentatonic: any combination sounds pleasant.
  const PENTA = [0, 2, 4, 7, 9];
  const C4 = 261.63;

  function ensure() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(comp);
      comp.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // Call from any user gesture (iOS needs this to allow sound).
  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    // A silent blip fully unlocks iOS Safari.
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(master);
      s.start(0);
    } catch (e) { /* ignore */ }
  }

  function ready() {
    return !muted && ctx && ctx.state === 'running' && voices < MAX_VOICES;
  }

  // Audio clock when running, otherwise wall clock (keeps visuals in time).
  function now() {
    if (ctx && ctx.state === 'running') return ctx.currentTime;
    return performance.now() / 1000;
  }

  function freqOf(step, octave) {
    // step: index in pentatonic scale (any integer), octave offset from C4
    const n = PENTA.length;
    const o = Math.floor(step / n) + (octave || 0);
    const s = ((step % n) + n) % n;
    return C4 * Math.pow(2, o + PENTA[s] / 12);
  }

  /**
   * Play one soft tone.
   * opts: type, dur, vol, attack, when (abs time), slide (target freq),
   *       detune, filter (lowpass Hz)
   */
  function tone(freq, opts) {
    if (!ready()) return;
    const o = opts || {};
    const t0 = Math.max(ctx.currentTime, o.when || 0);
    const dur = o.dur || 0.25;
    const vol = Math.min(0.5, o.vol == null ? 0.18 : o.vol);
    const attack = o.attack || 0.012;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
      if (o.detune) osc.detune.value = o.detune;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let last = g;
      osc.connect(g);
      if (o.filter) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(o.filter, t0);
        f.Q.value = 0.5;
        g.connect(f);
        last = f;
      }
      last.connect(master);
      voices++;
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
      osc.onended = () => { voices--; try { last.disconnect(); } catch (e) { /* ignore */ } };
    } catch (e) { /* never let sound break play */ }
  }

  // Soft filtered noise puff (wind, whoosh, page turn).
  function noise(opts) {
    if (!ready()) return;
    const o = opts || {};
    const dur = o.dur || 0.3;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = o.freq || 900;
      f.Q.value = o.q || 0.8;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.08, t0 + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(master);
      voices++;
      src.start(t0);
      src.onended = () => { voices--; try { g.disconnect(); } catch (e) { /* ignore */ } };
    } catch (e) { /* ignore */ }
  }

  // ---------- Named sounds ----------
  const S = {
    pop(p) { tone(520 * (p || 1), { type: 'sine', dur: 0.14, vol: 0.18, slide: 900 * (p || 1) }); },
    tap(p) { tone(660 * (p || 1), { type: 'triangle', dur: 0.09, vol: 0.12 }); },
    click(p) { tone(1200 * (p || 1), { type: 'triangle', dur: 0.04, vol: 0.08 }); },
    soft(p) { tone(330 * (p || 1), { type: 'sine', dur: 0.2, vol: 0.12 }); },
    up() { tone(392, { type: 'sine', dur: 0.18, vol: 0.14, slide: 587 }); },
    down() { tone(587, { type: 'sine', dur: 0.2, vol: 0.12, slide: 330 }); },
    boop(step) { tone(freqOf(step || 0), { type: 'triangle', dur: 0.22, vol: 0.16 }); },
    note(step, o) { tone(freqOf(step || 0), Object.assign({ type: 'sine', dur: 0.4, vol: 0.18 }, o)); },
    chime(step) {
      const f = freqOf(step || 0, 1);
      tone(f, { type: 'sine', dur: 0.9, vol: 0.14 });
      tone(f * 2.01, { type: 'sine', dur: 0.5, vol: 0.05 });
    },
    bell(freq, vol) {
      tone(freq, { type: 'sine', dur: 1.4, vol: vol || 0.16, attack: 0.004 });
      tone(freq * 2.76, { type: 'sine', dur: 0.6, vol: (vol || 0.16) * 0.25, attack: 0.004 });
      tone(freq * 5.4, { type: 'sine', dur: 0.25, vol: (vol || 0.16) * 0.1, attack: 0.002 });
    },
    moo() { tone(150, { type: 'sawtooth', dur: 0.9, vol: 0.1, slide: 110, filter: 600, attack: 0.08 }); },
    oink() {
      const t = ctx ? ctx.currentTime : 0;
      tone(260, { type: 'sawtooth', dur: 0.12, vol: 0.09, slide: 180, filter: 900, when: t });
      tone(240, { type: 'sawtooth', dur: 0.14, vol: 0.09, slide: 160, filter: 900, when: t + 0.17 });
    },
    meow() { tone(520, { type: 'triangle', dur: 0.6, vol: 0.12, slide: 800, filter: 1800, attack: 0.1 }); },
    woof() {
      const t = ctx ? ctx.currentTime : 0;
      tone(300, { type: 'sawtooth', dur: 0.14, vol: 0.12, slide: 170, filter: 900, when: t });
      tone(300, { type: 'sawtooth', dur: 0.14, vol: 0.12, slide: 170, filter: 900, when: t + 0.22 });
    },
    baa() { tone(380, { type: 'sawtooth', dur: 0.7, vol: 0.08, slide: 330, filter: 1100, attack: 0.05, detune: 12 }); },
    boing() { tone(180, { type: 'sine', dur: 0.4, vol: 0.2, slide: 520 }); },
    honk() {
      tone(392, { type: 'triangle', dur: 0.16, vol: 0.12, filter: 1400 });
      const t = ctx ? ctx.currentTime + 0.2 : 0;
      tone(392, { type: 'triangle', dur: 0.2, vol: 0.12, filter: 1400, when: t });
    },
    quack() {
      tone(600, { type: 'triangle', dur: 0.12, vol: 0.1, slide: 380, filter: 1600 });
      const t = ctx ? ctx.currentTime + 0.16 : 0;
      tone(560, { type: 'triangle', dur: 0.12, vol: 0.1, slide: 360, filter: 1600, when: t });
    },
    tweet() {
      const t = ctx ? ctx.currentTime : 0;
      [0, 0.12, 0.24].forEach((d, i) => tone(1800 + i * 200, { type: 'sine', dur: 0.08, vol: 0.06, slide: 2600, when: t + d }));
    },
    sparkle() {
      const t = ctx ? ctx.currentTime : 0;
      [0, 2, 4, 5, 7].forEach((s, i) => tone(freqOf(s, 1), { type: 'sine', dur: 0.4, vol: 0.09, when: t + i * 0.07 }));
    },
    whoosh() { noise({ dur: 0.45, freq: 700, vol: 0.06, q: 0.6 }); },
    rain() { noise({ dur: 1.5, freq: 3000, vol: 0.04, q: 0.4 }); },
    tick(p) { tone(1600 * (p || 1), { type: 'sine', dur: 0.03, vol: 0.06 }); },
    clack(p) { tone(900 * (p || 1), { type: 'triangle', dur: 0.05, vol: 0.12, filter: 2400 }); },
    knock(p) { tone(150 * (p || 1), { type: 'sine', dur: 0.12, vol: 0.2, slide: 90 * (p || 1) }); },
    creak(open) { tone(open ? 220 : 300, { type: 'triangle', dur: 0.45, vol: 0.06, slide: open ? 300 : 200, filter: 900 }); }
  };

  // ---------- Instruments for Sound Blobs ----------
  function instrument(name, freq, when) {
    switch (name) {
      case 'pink':   // round soft "ooh"
        tone(freq, { type: 'sine', dur: 0.55, vol: 0.2, attack: 0.04, when });
        tone(freq * 2, { type: 'sine', dur: 0.3, vol: 0.03, attack: 0.04, when });
        break;
      case 'butter': // little bell
        tone(freq * 2, { type: 'sine', dur: 0.8, vol: 0.12, attack: 0.003, when });
        tone(freq * 4.02, { type: 'sine', dur: 0.3, vol: 0.03, attack: 0.003, when });
        break;
      case 'mint':   // wooden marimba
        tone(freq, { type: 'triangle', dur: 0.3, vol: 0.2, attack: 0.004, when, filter: 2000 });
        tone(freq * 4, { type: 'sine', dur: 0.06, vol: 0.04, attack: 0.002, when });
        break;
      case 'sky':    // pluck
        tone(freq * 2, { type: 'triangle', dur: 0.22, vol: 0.14, attack: 0.002, when, filter: 1800 });
        break;
      case 'lilac':  // warm low hum
        tone(freq / 2, { type: 'sine', dur: 0.5, vol: 0.26, attack: 0.02, when });
        tone(freq, { type: 'triangle', dur: 0.25, vol: 0.04, attack: 0.02, when });
        break;
      default:
        tone(freq, { when });
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (master && ctx) {
      try { master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05); } catch (e) { /* ignore */ }
    }
  }

  PR.audio = Object.assign(S, {
    unlock, tone, noise, instrument, freqOf, now, setMuted,
    isMuted: () => muted
  });
  Object.defineProperty(PR.audio, 'ctx', { get: () => ctx });
})();
