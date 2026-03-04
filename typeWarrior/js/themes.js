/**
 * themes.js — Theme Management for TypeWarrior
 * Defines color themes and handles switching.
 */

export const THEMES = {
    'minimal-dark': {
        name: 'Minimal Dark',
        icon: '🌙',
        colors: {
            '--bg-primary': '#1a1a2e',
            '--bg-secondary': '#16213e',
            '--bg-tertiary': '#0f3460',
            '--bg-card': 'rgba(22, 33, 62, 0.8)',
            '--bg-card-hover': 'rgba(22, 33, 62, 0.95)',
            '--text-primary': '#e2e8f0',
            '--text-secondary': '#94a3b8',
            '--text-dimmed': '#475569',
            '--accent-primary': '#e2b714',
            '--accent-secondary': '#d2691e',
            '--accent-glow': 'rgba(226, 183, 20, 0.3)',
            '--correct': '#4ade80',
            '--incorrect': '#f87171',
            '--extra': '#fb923c',
            '--caret': '#e2b714',
            '--border': 'rgba(148, 163, 184, 0.1)',
            '--combo-fire': '#ff6b35',
            '--progress-bg': 'rgba(148, 163, 184, 0.1)',
            '--progress-fill': '#e2b714',
            '--modal-overlay': 'rgba(0, 0, 0, 0.7)',
            '--modal-bg': 'rgba(22, 33, 62, 0.95)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
        }
    },
    'minimal-light': {
        name: 'Minimal Light',
        icon: '☀️',
        colors: {
            '--bg-primary': '#f8f9fa',
            '--bg-secondary': '#ffffff',
            '--bg-tertiary': '#e9ecef',
            '--bg-card': 'rgba(255, 255, 255, 0.9)',
            '--bg-card-hover': 'rgba(255, 255, 255, 1)',
            '--text-primary': '#1a1a2e',
            '--text-secondary': '#495057',
            '--text-dimmed': '#adb5bd',
            '--accent-primary': '#6c5ce7',
            '--accent-secondary': '#a29bfe',
            '--accent-glow': 'rgba(108, 92, 231, 0.2)',
            '--correct': '#27ae60',
            '--incorrect': '#e74c3c',
            '--extra': '#e67e22',
            '--caret': '#6c5ce7',
            '--border': 'rgba(0, 0, 0, 0.08)',
            '--combo-fire': '#ff6348',
            '--progress-bg': 'rgba(0, 0, 0, 0.06)',
            '--progress-fill': '#6c5ce7',
            '--modal-overlay': 'rgba(0, 0, 0, 0.4)',
            '--modal-bg': 'rgba(255, 255, 255, 0.98)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
    },
    'cyberpunk': {
        name: 'Cyberpunk Neon',
        icon: '🌆',
        colors: {
            '--bg-primary': '#0a0a0f',
            '--bg-secondary': '#111118',
            '--bg-tertiary': '#1a1a25',
            '--bg-card': 'rgba(17, 17, 24, 0.9)',
            '--bg-card-hover': 'rgba(26, 26, 37, 0.95)',
            '--text-primary': '#e0e0ff',
            '--text-secondary': '#8888aa',
            '--text-dimmed': '#444466',
            '--accent-primary': '#ff2e97',
            '--accent-secondary': '#00f0ff',
            '--accent-glow': 'rgba(255, 46, 151, 0.3)',
            '--correct': '#00ff88',
            '--incorrect': '#ff3366',
            '--extra': '#ffaa00',
            '--caret': '#00f0ff',
            '--border': 'rgba(0, 240, 255, 0.15)',
            '--combo-fire': '#ff2e97',
            '--progress-bg': 'rgba(0, 240, 255, 0.1)',
            '--progress-fill': 'linear-gradient(90deg, #ff2e97, #00f0ff)',
            '--modal-overlay': 'rgba(0, 0, 0, 0.8)',
            '--modal-bg': 'rgba(17, 17, 24, 0.98)',
            '--shadow': '0 8px 32px rgba(255, 46, 151, 0.15)',
        }
    },
    'hacker': {
        name: 'Hacker',
        icon: '💻',
        colors: {
            '--bg-primary': '#0c0c0c',
            '--bg-secondary': '#111111',
            '--bg-tertiary': '#1a1a1a',
            '--bg-card': 'rgba(17, 17, 17, 0.9)',
            '--bg-card-hover': 'rgba(26, 26, 26, 0.95)',
            '--text-primary': '#00ff41',
            '--text-secondary': '#00cc33',
            '--text-dimmed': '#005500',
            '--accent-primary': '#00ff41',
            '--accent-secondary': '#39ff14',
            '--accent-glow': 'rgba(0, 255, 65, 0.2)',
            '--correct': '#39ff14',
            '--incorrect': '#ff0040',
            '--extra': '#ff8800',
            '--caret': '#00ff41',
            '--border': 'rgba(0, 255, 65, 0.15)',
            '--combo-fire': '#39ff14',
            '--progress-bg': 'rgba(0, 255, 65, 0.1)',
            '--progress-fill': '#00ff41',
            '--modal-overlay': 'rgba(0, 0, 0, 0.85)',
            '--modal-bg': 'rgba(12, 12, 12, 0.98)',
            '--shadow': '0 8px 32px rgba(0, 255, 65, 0.1)',
        }
    }
};

export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('tw-theme') || 'minimal-dark';
        this.apply(this.currentTheme);
    }

    /** Apply a theme by key */
    apply(themeKey) {
        const theme = THEMES[themeKey];
        if (!theme) return;

        this.currentTheme = themeKey;
        localStorage.setItem('tw-theme', themeKey);

        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });

        // Update active theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeKey);
        });
    }

    /** Cycle to next theme */
    next() {
        const keys = Object.keys(THEMES);
        const idx = keys.indexOf(this.currentTheme);
        const nextKey = keys[(idx + 1) % keys.length];
        this.apply(nextKey);
        return nextKey;
    }

    /** Get current theme name */
    getName() {
        return THEMES[this.currentTheme]?.name || 'Unknown';
    }
}
