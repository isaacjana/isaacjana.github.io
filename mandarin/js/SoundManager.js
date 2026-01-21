/**
 * SoundManager handles procedural audio generation for UI feedback.
 * Uses Web Audio API to avoid loading external assets.
 */
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume 30%
        this.enabled = true;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Plays a soft "pop" or "click" sound.
     * High pitch, very short decay.
     */
    playClick() {
        if (!this.enabled) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Jade-like "glass" click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    /**
     * Plays a pleasant "success" chime.
     * A major chord arpeggio.
     */
    playSuccess() {
        if (!this.enabled) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major scale: C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.05);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    /**
     * Plays a low "thud" or "wooden" sound for errors.
     */
    playError() {
        if (!this.enabled) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square'; // More texture
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        // Filter to make it sound "wooden"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /**
     * Plays a magical "level up" sound.
     * Use when a session is complete.
     */
    playLevelUp() {
        if (!this.enabled) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Oriental pentatonic sweep: C, D, E, G, A
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.08);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);

            osc.start(startTime);
            osc.stop(startTime + 1.5);
        });
    }
}

export default SoundManager;
