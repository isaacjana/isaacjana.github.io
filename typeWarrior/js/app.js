/**
 * app.js — Main Application Controller for TypeWarrior
 * Orchestrates all modules: engine, themes, UI interactions, and modal display.
 */

import { TypingEngine } from './engine.js';
import { ThemeManager, THEMES } from './themes.js';

class TypeWarriorApp {
    constructor() {
        /** @type {TypingEngine} */
        this.engine = new TypingEngine();
        /** @type {ThemeManager} */
        this.themeManager = new ThemeManager();

        // Current configuration
        this.config = {
            mode: 'time',
            timeLimit: 30,
            wordLimit: 50
        };

        // UI element references
        this.elements = {};

        // Bind methods
        this._onTick = this._onTick.bind(this);
        this._onFinish = this._onFinish.bind(this);
        this._onComboChange = this._onComboChange.bind(this);
    }

    /** Initialize the app after DOM is ready */
    init() {
        this._cacheElements();
        this._setupEngine();
        this._setupEventListeners();
        this._setupThemeSwitcher();
        this._startNewTest();

        // Focus handling for blur overlay
        this.engine.hiddenInput.addEventListener('blur', () => {
            if (!this.engine.isFinished) {
                this.engine.blur();
            }
        });
        this.engine.hiddenInput.addEventListener('focus', () => {
            this.engine.wordsContainer.classList.remove('blurred');
        });

        // Keyboard shortcut hint
        console.log(
            '%c⌨️ TypeWarrior Loaded! %cTab to restart • Esc to stop',
            'color: #e2b714; font-size: 16px; font-weight: bold;',
            'color: #94a3b8; font-size: 12px;'
        );
    }

    /** Cache all DOM element references */
    _cacheElements() {
        this.elements = {
            // Typing area
            wordsContainer: document.getElementById('words-container'),
            caret: document.getElementById('caret'),
            hiddenInput: document.getElementById('hidden-input'),
            typingArea: document.getElementById('typing-area'),

            // Progress
            progressBar: document.getElementById('progress-fill'),
            progressCar: document.getElementById('progress-car'),

            // Live stats
            liveWpm: document.getElementById('live-wpm'),
            liveAccuracy: document.getElementById('live-accuracy'),
            liveTime: document.getElementById('live-time'),
            liveCombo: document.getElementById('live-combo'),
            livePb: document.getElementById('live-pb'),
            comboLabel: document.getElementById('combo-label'),

            // Mode buttons
            modeButtons: document.querySelectorAll('.mode-btn'),
            timeOptions: document.getElementById('time-options'),
            wordOptions: document.getElementById('word-options'),
            timeBtns: document.querySelectorAll('.time-btn'),
            wordBtns: document.querySelectorAll('.word-btn'),

            // Controls
            restartBtn: document.getElementById('restart-btn'),
            soundToggle: document.getElementById('sound-toggle'),
            focusToggle: document.getElementById('focus-toggle'),
            soundTypeSelect: document.getElementById('sound-type'),

            // Result modal
            resultModal: document.getElementById('result-modal'),
            resultOverlay: document.getElementById('result-overlay'),
            resultWpm: document.getElementById('result-wpm'),
            resultRawWpm: document.getElementById('result-raw-wpm'),
            resultAccuracy: document.getElementById('result-accuracy'),
            resultTime: document.getElementById('result-time'),
            resultCorrectChars: document.getElementById('result-correct-chars'),
            resultIncorrectChars: document.getElementById('result-incorrect-chars'),
            resultExtraChars: document.getElementById('result-extra-chars'),
            resultCombo: document.getElementById('result-combo'),
            resultConsistency: document.getElementById('result-consistency'),
            resultChart: document.getElementById('result-chart'),
            resultRestartBtn: document.getElementById('result-restart-btn'),
            resultCloseBtn: document.getElementById('result-close-btn'),

            // Theme buttons
            themeButtons: document.querySelectorAll('.theme-btn'),

            // Blur overlay
            blurOverlay: document.getElementById('blur-overlay'),
        };
    }

    /** Set up the typing engine */
    _setupEngine() {
        this.engine.init({
            wordsContainer: this.elements.wordsContainer,
            caret: this.elements.caret,
            hiddenInput: this.elements.hiddenInput,
            progressBar: this.elements.progressBar,
            progressCar: this.elements.progressCar
        });

        this.engine.onTick = this._onTick;
        this.engine.onFinish = this._onFinish;
        this.engine.onComboChange = this._onComboChange;
    }

    /** Set up all event listeners */
    _setupEventListeners() {
        // Mode selection
        this.elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this._setMode(mode);
            });
        });

        // Time options
        this.elements.timeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.timeLimit = parseInt(btn.dataset.time);
                this.elements.timeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._startNewTest();
            });
        });

        // Word count options
        this.elements.wordBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.wordLimit = parseInt(btn.dataset.words);
                this.elements.wordBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._startNewTest();
            });
        });

        // Restart
        this.elements.restartBtn.addEventListener('click', () => {
            this._startNewTest();
        });

        // Sound toggle
        this.elements.soundToggle.addEventListener('click', () => {
            const enabled = this.engine.sounds.toggle();
            this.elements.soundToggle.classList.toggle('active', enabled);
            this.elements.soundToggle.querySelector('.sound-icon').textContent = enabled ? '🔊' : '🔇';
        });

        // Sound type
        if (this.elements.soundTypeSelect) {
            this.elements.soundTypeSelect.addEventListener('change', (e) => {
                this.engine.sounds.setType(e.target.value);
            });
        }

        // Focus mode
        this.elements.focusToggle.addEventListener('click', () => {
            this._toggleFocusMode();
        });

        // Result modal buttons
        this.elements.resultRestartBtn?.addEventListener('click', () => {
            this._hideResultModal();
            this._startNewTest();
        });
        this.elements.resultCloseBtn?.addEventListener('click', () => {
            this._hideResultModal();
        });
        this.elements.resultOverlay?.addEventListener('click', () => {
            this._hideResultModal();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.ctrlKey) {
                e.preventDefault();
                if (this.engine.mode !== 'developer') {
                    this._startNewTest();
                }
            }
            if (e.key === 'Escape') {
                if (this.elements.resultModal.classList.contains('visible')) {
                    this._hideResultModal();
                } else {
                    this._startNewTest();
                }
            }
            if (e.altKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                this._toggleFocusMode();
            }
        });
    }

    /** Set up theme switcher buttons */
    _setupThemeSwitcher() {
        this.elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.themeManager.apply(theme);
                this.elements.themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Set initial active state
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.themeManager.currentTheme);
        });
    }

    /** Switch game mode */
    _setMode(mode) {
        this.config.mode = mode;

        // Update button states
        this.elements.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide sub-options
        this.elements.timeOptions.classList.toggle('visible', mode === 'time');
        this.elements.wordOptions.classList.toggle('visible', mode === 'words');

        // Update time display visibility
        const timeDisplay = this.elements.liveTime.closest('.stat-item');
        if (timeDisplay) {
            timeDisplay.style.display = (mode === 'zen') ? 'none' : '';
        }

        this._startNewTest();
    }

    /** Start a fresh test */
    _startNewTest() {
        this._hideResultModal();
        this.engine.setup(this.config);

        // Hide PB in developer mode
        const pbStat = document.querySelector('.pb-display');
        if (pbStat) {
            pbStat.style.display = (this.config.mode === 'developer') ? 'none' : 'flex';
        }

        // Reset live stats display
        this.elements.liveWpm.textContent = '0';
        this.elements.liveAccuracy.textContent = '100%';
        this.elements.liveCombo.textContent = '0';
        this.elements.livePb.textContent = this.engine.stats.pb;
        this.elements.comboLabel.classList.remove('on-fire');

        if (this.config.mode === 'time') {
            this.elements.liveTime.textContent = this.config.timeLimit + 's';
        } else {
            this.elements.liveTime.textContent = '0s';
        }
    }

    /** Called every second during the test */
    _onTick(timeRemaining, wpm, accuracy, combo) {
        this.elements.liveWpm.textContent = wpm;
        this.elements.liveAccuracy.textContent = accuracy + '%';
        this.elements.liveCombo.textContent = combo;
        this.elements.livePb.textContent = Math.max(wpm, this.engine.stats.pb);

        if (this.config.mode === 'time') {
            this.elements.liveTime.textContent = timeRemaining + 's';
            // Urgency effect when time is low
            if (timeRemaining <= 5) {
                this.elements.liveTime.classList.add('urgent');
            } else {
                this.elements.liveTime.classList.remove('urgent');
            }
        } else {
            this.elements.liveTime.textContent = Math.round(this.engine.stats.getElapsed()) + 's';
        }
    }

    /** Called when the test finishes */
    _onFinish(results) {
        this._showResultModal(results);
    }

    /** Called when combo changes */
    _onComboChange(combo) {
        this.elements.liveCombo.textContent = combo;
        if (combo >= 10) {
            this.elements.comboLabel.classList.add('on-fire');
        } else {
            this.elements.comboLabel.classList.remove('on-fire');
        }
    }

    /** Show the result modal with stats */
    _showResultModal(results) {
        this.elements.resultWpm.textContent = results.wpm;
        this.elements.resultRawWpm.textContent = results.rawWpm;
        this.elements.resultAccuracy.textContent = results.accuracy + '%';
        this.elements.resultTime.textContent = results.elapsed + 's';
        this.elements.resultCorrectChars.textContent = results.correctChars;
        this.elements.resultIncorrectChars.textContent = results.incorrectChars;
        this.elements.resultExtraChars.textContent = results.extraChars;
        this.elements.resultCombo.textContent = results.maxCombo;
        this.elements.resultConsistency.textContent = results.consistency + '%';

        // Render chart
        if (results.history.length >= 2) {
            this.engine.stats.renderChart(this.elements.resultChart);
            this.elements.resultChart.style.display = 'block';
        } else {
            this.elements.resultChart.style.display = 'none';
        }

        // Animate modal in
        requestAnimationFrame(() => {
            this.elements.resultModal.classList.add('visible');
            this.elements.resultOverlay.classList.add('visible');
        });

        // Animate stat numbers
        this._animateStatNumbers();
    }

    /** Hide the result modal */
    _hideResultModal() {
        this.elements.resultModal.classList.remove('visible');
        this.elements.resultOverlay.classList.remove('visible');
    }

    /** Animate stat numbers counting up */
    _animateStatNumbers() {
        const wpmTarget = parseInt(this.elements.resultWpm.textContent);
        const accTarget = parseInt(this.elements.resultAccuracy.textContent);

        let wpmCurrent = 0;
        let accCurrent = 0;
        const duration = 800;
        const startTime = performance.now();

        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

            this.elements.resultWpm.textContent = Math.round(wpmTarget * ease);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.elements.resultWpm.textContent = wpmTarget;
            }
        };

        requestAnimationFrame(animate);
    }

    _toggleFocusMode() {
        const isActive = document.body.classList.toggle('focus-mode');
        this.elements.focusToggle.classList.toggle('active', isActive);
    }
}

// ─── Bootstrap ───
document.addEventListener('DOMContentLoaded', () => {
    const app = new TypeWarriorApp();
    app.init();

    // Make accessible globally for debugging
    window.__tw = app;
});
