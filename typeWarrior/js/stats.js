/**
 * stats.js — Statistics Tracking & Chart Rendering for TypeWarrior
 * Tracks per-second WPM data and renders a performance chart using Canvas.
 */

export class StatsTracker {
    constructor() {
        this.reset();
    }

    /** Reset all tracking data */
    reset() {
        this.startTime = null;
        this.endTime = null;
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.totalKeystrokes = 0;
        this.correctWords = 0;
        this.incorrectWords = 0;
        this.wpmHistory = [];       // { time: seconds, wpm: number, raw: number }
        this.lastSnapshotTime = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.extraChars = 0;
    }

    /** Mark the start of the test */
    start() {
        this.startTime = performance.now();
        this.lastSnapshotTime = 0;
    }

    /** Record a correct character */
    recordCorrect() {
        this.correctChars++;
        this.totalKeystrokes++;
    }

    /** Record an incorrect character */
    recordIncorrect() {
        this.incorrectChars++;
        this.totalKeystrokes++;
    }

    /** Record an extra character (typed beyond current word length) */
    recordExtra() {
        this.extraChars++;
        this.totalKeystrokes++;
        this.incorrectChars++;
    }

    /** Record a correct word completion */
    recordWordComplete(correct = true) {
        if (correct) {
            this.correctWords++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        } else {
            this.incorrectWords++;
            this.combo = 0;
        }
    }

    /** Reset combo streak on error */
    breakCombo() {
        this.combo = 0;
    }

    /** Get elapsed time in seconds */
    getElapsed() {
        if (!this.startTime) return 0;
        const end = this.endTime || performance.now();
        return (end - this.startTime) / 1000;
    }

    /** Calculate current WPM (correct characters / 5 / minutes) */
    getWPM() {
        const elapsed = this.getElapsed();
        if (elapsed < 0.5) return 0;
        return Math.round((this.correctChars / 5) / (elapsed / 60));
    }

    /** Calculate raw WPM (all keystrokes / 5 / minutes) */
    getRawWPM() {
        const elapsed = this.getElapsed();
        if (elapsed < 0.5) return 0;
        return Math.round((this.totalKeystrokes / 5) / (elapsed / 60));
    }

    /** Calculate accuracy percentage */
    getAccuracy() {
        if (this.totalKeystrokes === 0) return 100;
        return Math.round((this.correctChars / this.totalKeystrokes) * 100);
    }

    /** Take a periodic snapshot for the chart (call every ~1 second) */
    snapshot() {
        const elapsed = this.getElapsed();
        if (elapsed - this.lastSnapshotTime >= 1) {
            this.wpmHistory.push({
                time: Math.round(elapsed),
                wpm: this.getWPM(),
                raw: this.getRawWPM(),
                accuracy: this.getAccuracy()
            });
            this.lastSnapshotTime = elapsed;
        }
    }

    /** End the test */
    end() {
        this.endTime = performance.now();
        this.snapshot(); // Final snapshot
    }

    /** Get final results object */
    getResults() {
        return {
            wpm: this.getWPM(),
            rawWpm: this.getRawWPM(),
            accuracy: this.getAccuracy(),
            correctChars: this.correctChars,
            incorrectChars: this.incorrectChars,
            extraChars: this.extraChars,
            totalKeystrokes: this.totalKeystrokes,
            correctWords: this.correctWords,
            incorrectWords: this.incorrectWords,
            elapsed: Math.round(this.getElapsed()),
            maxCombo: this.maxCombo,
            history: this.wpmHistory
        };
    }

    /**
     * Render WPM over time chart on a canvas element
     * @param {HTMLCanvasElement} canvas 
     */
    renderChart(canvas) {
        if (!canvas || this.wpmHistory.length < 2) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 30, right: 20, bottom: 40, left: 50 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;

        const history = this.wpmHistory;
        const maxWPM = Math.max(...history.map(d => Math.max(d.wpm, d.raw)), 10);
        const maxTime = history[history.length - 1].time || 1;

        // Colors from CSS variables
        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent-primary').trim() || '#e2b714';
        const secondaryColor = style.getPropertyValue('--text-secondary').trim() || '#94a3b8';
        const dimColor = style.getPropertyValue('--text-dimmed').trim() || '#475569';
        const textColor = style.getPropertyValue('--text-primary').trim() || '#e2e8f0';
        const correctColor = style.getPropertyValue('--correct').trim() || '#4ade80';

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = dimColor + '30';
        ctx.lineWidth = 1;
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + (plotH * i) / ySteps;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotW, y);
            ctx.stroke();

            // Y labels (WPM)
            const label = Math.round(maxWPM * (1 - i / ySteps));
            ctx.fillStyle = secondaryColor;
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(label, padding.left - 8, y + 4);
        }

        // X axis labels (time)
        const xSteps = Math.min(history.length, 10);
        const xInterval = Math.ceil(history.length / xSteps);
        ctx.textAlign = 'center';
        for (let i = 0; i < history.length; i += xInterval) {
            const x = padding.left + (history[i].time / maxTime) * plotW;
            ctx.fillStyle = secondaryColor;
            ctx.fillText(history[i].time + 's', x, h - padding.bottom + 20);
        }

        // Helper: plot a smooth line
        const plotLine = (dataKey, color, lineWidth = 2) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            history.forEach((d, i) => {
                const x = padding.left + (d.time / maxTime) * plotW;
                const y = padding.top + plotH - (d[dataKey] / maxWPM) * plotH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Fill gradient under the line
            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
            gradient.addColorStop(0, color + '30');
            gradient.addColorStop(1, color + '05');

            ctx.lineTo(padding.left + plotW, padding.top + plotH);
            ctx.lineTo(padding.left, padding.top + plotH);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        // Plot Raw WPM (dimmer)
        plotLine('raw', secondaryColor + '80', 1.5);
        // Plot WPM (accent)
        plotLine('wpm', accentColor, 2.5);

        // Legend
        ctx.font = '12px Inter, system-ui, sans-serif';
        const legendY = 15;

        ctx.fillStyle = accentColor;
        ctx.fillRect(padding.left, legendY - 6, 12, 3);
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText('WPM', padding.left + 18, legendY);

        ctx.fillStyle = secondaryColor + '80';
        ctx.fillRect(padding.left + 70, legendY - 6, 12, 3);
        ctx.fillStyle = textColor;
        ctx.fillText('Raw', padding.left + 88, legendY);

        // Dots on main WPM line
        history.forEach(d => {
            const x = padding.left + (d.time / maxTime) * plotW;
            const y = padding.top + plotH - (d.wpm / maxWPM) * plotH;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();
        });
    }
}
