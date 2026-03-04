/**
 * effects.js — Visual Effects for TypeWarrior
 * Particle system, combo fire, and visual feedback effects.
 */

export class EffectsEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.fireParticles = [];
        this.animFrame = null;
        this.isRunning = false;
    }

    /** Initialize the canvas overlay for particle effects */
    init() {
        this.canvas = document.getElementById('effects-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /** Start the animation loop */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._loop();
    }

    /** Stop the animation loop */
    stop() {
        this.isRunning = false;
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        this.particles = [];
        this.fireParticles = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /** Spawn particles on correct keystroke at position */
    spawnKeystroke(x, y, color = 'var(--accent-primary)') {
        const resolvedColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-primary').trim() || '#e2b714';

        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.8) * 4,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color: resolvedColor
            });
        }
        this.start();
    }

    /** Spawn error shake particles */
    spawnError(x, y) {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--incorrect').trim() || '#f87171';

        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                decay: 0.03 + Math.random() * 0.02,
                size: 2 + Math.random() * 2,
                color
            });
        }
        this.start();
    }

    /** Activate "On Fire" effect for combo streaks */
    activateFire(element) {
        if (!element) return;
        element.classList.add('on-fire');

        // Create floating fire particles near the typing area
        const rect = element.getBoundingClientRect();
        const baseX = rect.left + rect.width / 2;
        const baseY = rect.top;

        for (let i = 0; i < 8; i++) {
            this.fireParticles.push({
                x: baseX + (Math.random() - 0.5) * rect.width,
                y: baseY + Math.random() * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: -(1 + Math.random() * 3),
                life: 1,
                decay: 0.01 + Math.random() * 0.015,
                size: 3 + Math.random() * 5,
                hue: 15 + Math.random() * 30 // Orange-red range
            });
        }
        this.start();
    }

    /** Deactivate fire effect */
    deactivateFire(element) {
        if (!element) return;
        element.classList.remove('on-fire');
        this.fireParticles = [];
    }

    /** Spawn celebration particles for test complete */
    celebrate() {
        const colors = ['#e2b714', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

        for (let burst = 0; burst < 5; burst++) {
            setTimeout(() => {
                const cx = Math.random() * this.canvas.width;
                const cy = Math.random() * this.canvas.height * 0.6;
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20;
                    const speed = 2 + Math.random() * 4;
                    this.particles.push({
                        x: cx, y: cy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1,
                        decay: 0.008 + Math.random() * 0.01,
                        size: 3 + Math.random() * 4,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    });
                }
                this.start();
            }, burst * 200);
        }
    }

    /** Main animation loop */
    _loop() {
        if (!this.isRunning) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Regular particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= p.decay;

            if (p.life <= 0) return false;

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        // Fire particles
        this.fireParticles = this.fireParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.3;
            p.life -= p.decay;

            if (p.life <= 0) return false;

            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = `hsla(${p.hue}, 100%, ${50 + (1 - p.life) * 30}%, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        ctx.globalAlpha = 1;

        if (this.particles.length === 0 && this.fireParticles.length === 0) {
            this.isRunning = false;
            return;
        }

        this.animFrame = requestAnimationFrame(() => this._loop());
    }
}
