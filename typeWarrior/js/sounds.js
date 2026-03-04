/**
 * sounds.js — Sound Design System for TypeWarrior
 * Uses Web Audio API to generate typing sounds without external files.
 */

export class SoundEngine {
    constructor() {
        this.enabled = false;
        this.volume = 0.3;
        this.soundType = 'mechanical'; // mechanical, typewriter, arcade
        this.ctx = null;
    }

    /** Initialize AudioContext (must be called after user gesture) */
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    /** Toggle sounds on/off */
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.init();
        return this.enabled;
    }

    /** Set sound type: mechanical | typewriter | arcade */
    setType(type) {
        this.soundType = type;
    }

    /** Set volume (0.0 – 1.0) */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /** Play a keypress sound */
    playKey() {
        if (!this.enabled || !this.ctx) return;
        switch (this.soundType) {
            case 'mechanical': this._playMechanical(); break;
            case 'typewriter': this._playTypewriter(); break;
            case 'arcade': this._playArcade(); break;
        }
    }

    /** Play an error sound */
    playError() {
        if (!this.enabled || !this.ctx) return;
        this._playTone(220, 0.08, 'square', 0.15);
    }

    /** Play a word-complete sound */
    playWordComplete() {
        if (!this.enabled || !this.ctx) return;
        this._playTone(880, 0.05, 'sine', 0.1);
    }

    /** Play combo milestone sound */
    playCombo() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        [523, 659, 784].forEach((freq, i) => {
            this._playToneAt(freq, now + i * 0.08, 0.1, 'sine', 0.15);
        });
    }

    /** Play test complete fanfare */
    playComplete() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
            this._playToneAt(freq, now + i * 0.12, 0.2, 'sine', 0.2);
        });
    }

    // ---- Private sound generators ----

    _playMechanical() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        // Click down
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'highpass';
        filter.frequency.value = 2000 + Math.random() * 3000;

        osc.type = 'square';
        osc.frequency.value = 4000 + Math.random() * 2000;

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);

        // Thock
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 150 + Math.random() * 50;
        gain2.gain.setValueAtTime(this.volume * 0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.06);
    }

    _playTypewriter() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        // Metal strike
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000 + Math.random() * 2000;
        filter.Q.value = 5;
        gain.gain.value = this.volume * 0.4;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(now);
    }

    _playArcade() {
        const freqs = [600, 700, 800, 900, 1000];
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        this._playTone(freq, 0.04, 'square', 0.12);
    }

    _playTone(freq, duration, type = 'sine', vol = null) {
        this._playToneAt(freq, this.ctx.currentTime, duration, type, vol);
    }

    _playToneAt(freq, startTime, duration, type = 'sine', vol = null) {
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        const v = (vol !== null ? vol : this.volume) * this.volume;
        gain.gain.setValueAtTime(v, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
}
