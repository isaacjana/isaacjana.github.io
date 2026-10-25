/* =========================================================
   Cozy Tales - js/audio.js
   Tiny Web Audio helper. Every sound is synthesised: soft
   sine/triangle tones with short envelopes. No audio files.
   SB.audio.play('name') is what tappable scene items call.
   ========================================================= */
(function () {
  'use strict';
  const SB = window.SB = window.SB || {};

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
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(master);
      s.start(0);
    } catch (e) { /* ignore */ }
  }

  const ready = () => !muted && ctx && ctx.state === 'running' && voices < MAX_VOICES;
  const t = () => (ctx ? ctx.currentTime : 0);

  function freqOf(step, octave) {
    const n = PENTA.length;
    const o = Math.floor(step / n) + (octave || 0);
    const s = ((step % n) + n) % n;
    return C4 * Math.pow(2, o + PENTA[s] / 12);
  }

  // One soft tone. opts: type, dur, vol, attack, when, slide, filter
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
    } catch (e) { /* never let sound break the story */ }
  }

  // Soft filtered noise puff (wind, splash, page turn).
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
      const t0 = ctx.currentTime + (o.delay || 0);
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
  const rnd = (a, b) => a + Math.random() * (b - a);
  const SND = {
    pop() { tone(520, { dur: 0.14, vol: 0.18, slide: 900 }); },
    tap() { tone(660, { type: 'triangle', dur: 0.09, vol: 0.12 }); },
    soft() { tone(330, { dur: 0.2, vol: 0.12 }); },
    up() { tone(392, { dur: 0.18, vol: 0.14, slide: 587 }); },
    down() { tone(587, { dur: 0.2, vol: 0.12, slide: 330 }); },
    page() { noise({ dur: 0.3, freq: 2200, vol: 0.05, q: 0.7 }); tone(900, { type: 'triangle', dur: 0.05, vol: 0.05 }); },
    boing() { tone(180, { dur: 0.4, vol: 0.2, slide: 520 }); },
    chime() {
      const f = freqOf(rnd(0, 5) | 0, 1);
      tone(f, { dur: 0.9, vol: 0.14 });
      tone(f * 2.01, { dur: 0.5, vol: 0.05 });
    },
    bell() { const f = freqOf(2, 1); tone(f, { dur: 1.4, vol: 0.16, attack: 0.004 }); tone(f * 2.76, { dur: 0.6, vol: 0.04, attack: 0.004 }); },
    twinkle() {
      const w = t();
      [4, 6, 9, 7].forEach((s, i) => tone(freqOf(s, 1), { dur: 0.35, vol: 0.08, when: w + i * 0.08 }));
    },
    sparkle() {
      const w = t();
      [0, 2, 4, 5, 7].forEach((s, i) => tone(freqOf(s, 1), { dur: 0.4, vol: 0.09, when: w + i * 0.07 }));
    },
    fanfare() {
      const w = t();
      [0, 2, 4, 5, 7, 9, 10].forEach((s, i) => tone(freqOf(s, 0), { type: 'triangle', dur: 0.5, vol: 0.12, when: w + i * 0.11 }));
      tone(freqOf(10, 1), { dur: 1.2, vol: 0.12, when: w + 0.8 });
    },
    hoot() {
      const w = t();
      tone(430, { dur: 0.32, vol: 0.16, slide: 340, filter: 900 });
      tone(380, { dur: 0.4, vol: 0.16, slide: 300, filter: 900, when: w + 0.4 });
    },
    grunt() { tone(170, { type: 'triangle', dur: 0.35, vol: 0.2, slide: 110, filter: 600 }); },
    quack() {
      const w = t();
      tone(600, { type: 'triangle', dur: 0.12, vol: 0.1, slide: 380, filter: 1600 });
      tone(560, { type: 'triangle', dur: 0.12, vol: 0.1, slide: 360, filter: 1600, when: w + 0.16 });
    },
    yip() {
      const w = t();
      tone(900, { type: 'triangle', dur: 0.1, vol: 0.1, slide: 1300, filter: 2200 });
      tone(1000, { type: 'triangle', dur: 0.14, vol: 0.1, slide: 1500, filter: 2200, when: w + 0.13 });
    },
    squeak() { tone(1500, { dur: 0.14, vol: 0.1, slide: 2300 }); tone(1750, { dur: 0.1, vol: 0.05, slide: 2500 }); },
    hop() { tone(300, { dur: 0.16, vol: 0.14, slide: 560 }); },
    splash() { noise({ dur: 0.55, freq: 1800, vol: 0.1, q: 0.5 }); tone(320, { dur: 0.25, vol: 0.12, slide: 120 }); },
    drip() { tone(900, { dur: 0.1, vol: 0.1, slide: 480 }); },
    bubble() { tone(rnd(480, 760), { dur: 0.13, vol: 0.14, slide: rnd(900, 1300) }); },
    whoosh() { noise({ dur: 0.5, freq: 700, vol: 0.07, q: 0.6 }); },
    snore() { tone(120, { type: 'triangle', dur: 0.9, vol: 0.14, slide: 85, filter: 420 }); },
    giggle() {
      const w = t();
      [0, 1, 0, 2, 1].forEach((s, i) => tone(freqOf(s + 5, 1), { type: 'triangle', dur: 0.1, vol: 0.09, when: w + i * 0.09 }));
    },
    sneeze() {
      tone(280, { dur: 0.55, vol: 0.14, slide: 900, filter: 1500 });
      noise({ dur: 0.4, freq: 1300, vol: 0.16, q: 0.4, delay: 0.55 });
      tone(200, { type: 'triangle', dur: 0.3, vol: 0.18, slide: 90, when: t() + 0.55 });
    },
    tickle() { tone(900, { dur: 0.08, vol: 0.08, slide: 1100 }); },
    thud() { tone(130, { dur: 0.18, vol: 0.2, slide: 70 }); }
  };

  SB.audio = {
    unlock,
    play(name) { const f = SND[name]; if (f) { try { f(); } catch (e) { /* ignore */ } } },
    setMuted(m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : 0.55;
    },
    isMuted: () => muted,
    get ctx() { return ctx; }
  };
})();
