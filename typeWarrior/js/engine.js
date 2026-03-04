/**
 * engine.js — Core Typing Engine for TypeWarrior
 * Handles word rendering, keystroke processing, caret animation, and game state.
 */

import { getWords } from './words.js';
import { StatsTracker } from './stats.js';
import { SoundEngine } from './sounds.js';
import { EffectsEngine } from './effects.js';

export class TypingEngine {
    constructor() {
        /** @type {StatsTracker} */
        this.stats = new StatsTracker();
        /** @type {SoundEngine} */
        this.sounds = new SoundEngine();
        /** @type {EffectsEngine} */
        this.effects = new EffectsEngine();

        // DOM references
        this.wordsContainer = null;
        this.caretEl = null;
        this.hiddenInput = null;
        this.progressBar = null;
        this.progressCar = null;

        // State
        this.words = [];
        this.wordElements = [];
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.typedChars = [];       // Per-word: array of typed chars
        this.isActive = false;
        this.isFinished = false;

        // Mode config
        this.mode = 'time';         // time, words, sudden-death, developer, zen
        this.timeLimit = 30;        // for time mode
        this.wordLimit = 50;        // for word count mode
        this.timer = null;
        this.timeRemaining = 0;
        this.snapshotInterval = null;

        // Callbacks
        this.onTick = null;         // (timeRemaining, wpm, accuracy, combo) => void
        this.onFinish = null;       // (results) => void
        this.onComboChange = null;  // (combo) => void

        // Smooth caret positioning
        this._caretX = 0;
        this._caretY = 0;

        // Keep track of words container scroll
        this._visibleLines = 3;
    }

    /**
     * Initialize the engine with DOM elements
     */
    init(elements) {
        this.wordsContainer = elements.wordsContainer;
        this.caretEl = elements.caret;
        this.hiddenInput = elements.hiddenInput;
        this.progressBar = elements.progressBar;
        this.progressCar = elements.progressCar;

        this.effects.init();

        // Input handling
        this.hiddenInput.addEventListener('input', (e) => this._handleInput(e));
        this.hiddenInput.addEventListener('keydown', (e) => this._handleKeydown(e));

        // Focus management
        this.wordsContainer.addEventListener('click', () => this.focus());
        document.addEventListener('keydown', (e) => {
            if (!this.isFinished && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // If the user starts typing and focus isn't on the input, redirect
                if (document.activeElement !== this.hiddenInput) {
                    this.focus();
                }
            }
        });
    }

    /** Focus the hidden input */
    focus() {
        this.hiddenInput.focus();
        this.wordsContainer.classList.remove('blurred');
    }

    /** Blur indicator */
    blur() {
        this.wordsContainer.classList.add('blurred');
    }

    /**
     * Set up a new test
     * @param {object} config - { mode, timeLimit, wordLimit }
     */
    setup(config = {}) {
        this.mode = config.mode || 'time';
        this.timeLimit = config.timeLimit || 30;
        this.wordLimit = config.wordLimit || 50;

        this.isActive = false;
        this.isFinished = false;
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.typedChars = [];
        this.stats.reset();

        if (this.timer) clearInterval(this.timer);
        if (this.snapshotInterval) clearInterval(this.snapshotInterval);
        this.timer = null;
        this.snapshotInterval = null;

        // Generate words
        const wordMode = this.mode === 'developer' ? 'developer' : 'english';
        let wordCount;
        switch (this.mode) {
            case 'time':
                wordCount = 200; // More than enough for any time limit
                break;
            case 'words':
                wordCount = this.wordLimit;
                break;
            case 'sudden-death':
                wordCount = 200;
                break;
            case 'zen':
                wordCount = 300;
                break;
            case 'developer':
                wordCount = 150;
                break;
            default:
                wordCount = 200;
        }

        this.words = getWords(wordMode, wordCount);
        this.typedChars = this.words.map(() => []);

        // Time setup
        if (this.mode === 'time') {
            this.timeRemaining = this.timeLimit;
        }

        this._renderWords();
        this._updateCaret();
        this._updateProgress();

        // Clear effects
        this.effects.stop();
        this.effects.deactivateFire(this.wordsContainer);

        // Clear hidden input
        this.hiddenInput.value = '';

        this.focus();
    }

    /** Start the test (called on first keystroke) */
    _start() {
        if (this.isActive) return;
        this.isActive = true;
        this.stats.start();

        // Snapshot interval for chart data
        this.snapshotInterval = setInterval(() => {
            if (this.isActive) this.stats.snapshot();
        }, 1000);

        // Timer for time mode
        if (this.mode === 'time') {
            this.timer = setInterval(() => {
                this.timeRemaining--;
                this._tick();
                if (this.timeRemaining <= 0) {
                    this.finish();
                }
            }, 1000);
        }
    }

    /** Called every second to update UI */
    _tick() {
        if (this.onTick) {
            this.onTick(
                this.timeRemaining,
                this.stats.getWPM(),
                this.stats.getAccuracy(),
                this.stats.combo
            );
        }
    }

    /** Complete the test */
    finish() {
        if (this.isFinished) return;
        this.isActive = false;
        this.isFinished = true;

        if (this.timer) clearInterval(this.timer);
        if (this.snapshotInterval) clearInterval(this.snapshotInterval);

        this.stats.end();
        this.effects.deactivateFire(this.wordsContainer);
        this.sounds.playComplete();
        this.effects.celebrate();

        if (this.onFinish) {
            // Small delay to let the celebration start
            setTimeout(() => {
                this.onFinish(this.stats.getResults());
            }, 500);
        }
    }

    /** Handle keyboard input events */
    _handleInput(e) {
        if (this.isFinished) return;

        const data = e.data;
        if (data === null) return; // Handled by keydown (backspace, etc.)

        // Start the test on first character
        if (!this.isActive) this._start();

        // Process each character
        for (const char of data) {
            if (char === ' ') {
                this._handleSpace();
            } else {
                this._handleChar(char);
            }
        }

        // Clear input to prevent it from building up
        this.hiddenInput.value = '';
    }

    /** Handle keydown for backspace and special keys */
    _handleKeydown(e) {
        if (this.isFinished) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            if (e.ctrlKey) {
                this._handleCtrlBackspace();
            } else {
                this._handleBackspace();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // In developer mode, tab = 2 spaces
            if (this.mode === 'developer') {
                this._handleChar(' ');
                this._handleChar(' ');
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // Restart
        }
    }

    /** Handle a regular character input */
    _handleChar(char) {
        const word = this.words[this.currentWordIndex];
        const typed = this.typedChars[this.currentWordIndex];

        typed.push(char);
        this.currentCharIndex = typed.length;

        const charIndex = typed.length - 1;
        const expected = word[charIndex];

        if (charIndex >= word.length) {
            // Extra character beyond word length
            this.stats.recordExtra();
            this.sounds.playKey(); // still play sound
        } else if (char === expected) {
            this.stats.recordCorrect();
            this.sounds.playKey();

            // Particle effect at letter position
            const letterEl = this.wordElements[this.currentWordIndex]?.children[charIndex];
            if (letterEl) {
                const rect = letterEl.getBoundingClientRect();
                this.effects.spawnKeystroke(rect.left + rect.width / 2, rect.top);
            }
        } else {
            this.stats.recordIncorrect();
            this.sounds.playError();

            // Sudden death check
            if (this.mode === 'sudden-death') {
                this.finish();
                return;
            }

            // Error particle
            const letterEl = this.wordElements[this.currentWordIndex]?.children[charIndex];
            if (letterEl) {
                const rect = letterEl.getBoundingClientRect();
                this.effects.spawnError(rect.left + rect.width / 2, rect.top);
            }
        }

        this._updateWordDisplay();
        this._updateCaret();
        this._tick();
    }

    /** Handle spacebar — move to next word */
    _handleSpace() {
        const word = this.words[this.currentWordIndex];
        const typed = this.typedChars[this.currentWordIndex];

        // Don't skip if nothing is typed
        if (typed.length === 0) return;

        // Check if word was typed correctly
        const correct = typed.length === word.length &&
            typed.every((c, i) => c === word[i]);

        this.stats.recordWordComplete(correct);

        if (!correct) {
            this.stats.breakCombo();
            this.effects.deactivateFire(this.wordsContainer);
        }

        // Combo effects
        if (this.stats.combo >= 10) {
            this.effects.activateFire(this.wordsContainer);
            if (this.stats.combo === 10) {
                this.sounds.playCombo();
            }
        }

        if (this.onComboChange) {
            this.onComboChange(this.stats.combo);
        }

        // Mark the word as complete
        this._markWordComplete(correct);

        // Move to next word
        this.currentWordIndex++;
        this.currentCharIndex = 0;

        // Check if we've finished all words (word count mode)
        if (this.mode === 'words' && this.currentWordIndex >= this.wordLimit) {
            this.finish();
            return;
        }

        // Check if we need more words (zen mode)
        if (this.mode === 'zen' && this.currentWordIndex >= this.words.length - 10) {
            this._appendMoreWords();
        }

        // Check if out of words
        if (this.currentWordIndex >= this.words.length) {
            this.finish();
            return;
        }

        this._updateWordDisplay();
        this._updateCaret();
        this._scrollToCurrentWord();
        this._updateProgress();
        this.sounds.playWordComplete();
    }

    /** Handle backspace */
    _handleBackspace() {
        const typed = this.typedChars[this.currentWordIndex];

        if (typed.length > 0) {
            typed.pop();
            this.currentCharIndex = typed.length;
            this._updateWordDisplay();
            this._updateCaret();
        }
    }

    /** Handle Ctrl+Backspace (delete word) */
    _handleCtrlBackspace() {
        this.typedChars[this.currentWordIndex] = [];
        this.currentCharIndex = 0;
        this._updateWordDisplay();
        this._updateCaret();
    }

    /** Render all words as span elements */
    _renderWords() {
        this.wordsContainer.innerHTML = '';
        this.wordElements = [];

        this.words.forEach((word, wIdx) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word';
            if (wIdx === 0) wordEl.classList.add('active');

            // Create letter spans
            word.split('').forEach(letter => {
                const span = document.createElement('span');
                span.className = 'letter';
                span.textContent = letter;
                wordEl.appendChild(span);
            });

            this.wordsContainer.appendChild(wordEl);
            this.wordElements.push(wordEl);
        });
    }

    /** Update the display of the current word based on typed chars */
    _updateWordDisplay() {
        const wIdx = this.currentWordIndex;
        const wordEl = this.wordElements[wIdx];
        if (!wordEl) return;

        const word = this.words[wIdx];
        const typed = this.typedChars[wIdx];

        // Remove any existing extra chars
        while (wordEl.children.length > word.length) {
            wordEl.removeChild(wordEl.lastChild);
        }

        // Update letter classes
        for (let i = 0; i < word.length; i++) {
            const letterEl = wordEl.children[i];
            if (!letterEl) continue;

            letterEl.className = 'letter';

            if (i < typed.length) {
                if (typed[i] === word[i]) {
                    letterEl.classList.add('correct');
                } else {
                    letterEl.classList.add('incorrect');
                    letterEl.classList.add('shake');
                    // Remove shake class after animation
                    setTimeout(() => letterEl.classList.remove('shake'), 300);
                }
            }
        }

        // Add extra typed characters
        for (let i = word.length; i < typed.length; i++) {
            const extraSpan = document.createElement('span');
            extraSpan.className = 'letter extra';
            extraSpan.textContent = typed[i];
            wordEl.appendChild(extraSpan);
        }

        // Update active class
        this.wordElements.forEach((el, i) => {
            el.classList.toggle('active', i === wIdx);
        });
    }

    /** Mark a completed word as correct or incorrect */
    _markWordComplete(correct) {
        const wordEl = this.wordElements[this.currentWordIndex];
        if (!wordEl) return;
        wordEl.classList.remove('active');
        wordEl.classList.add(correct ? 'word-correct' : 'word-incorrect');
    }

    /** Smoothly update caret position */
    _updateCaret() {
        if (!this.caretEl) return;

        const wordEl = this.wordElements[this.currentWordIndex];
        if (!wordEl) return;

        let targetEl;
        const typed = this.typedChars[this.currentWordIndex];

        if (typed.length === 0) {
            // Position caret at start of word
            targetEl = wordEl.children[0];
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = this.wordsContainer.getBoundingClientRect();
                this._caretX = rect.left - containerRect.left;
                this._caretY = rect.top - containerRect.top;
            }
        } else {
            // Position caret after the last typed character
            const lastIdx = Math.min(typed.length, wordEl.children.length) - 1;
            targetEl = wordEl.children[lastIdx];
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = this.wordsContainer.getBoundingClientRect();
                this._caretX = rect.right - containerRect.left;
                this._caretY = rect.top - containerRect.top;
            }
        }

        this.caretEl.style.transform = `translate(${this._caretX}px, ${this._caretY}px)`;
    }

    /** Scroll words container to keep current word visible */
    _scrollToCurrentWord() {
        const wordEl = this.wordElements[this.currentWordIndex];
        if (!wordEl) return;

        const containerRect = this.wordsContainer.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();

        // Calculate the word's top position relative to the container's scroll
        const relativeTop = wordRect.top - containerRect.top + this.wordsContainer.scrollTop;
        const lineHeight = wordRect.height + 8; // Approximate line height + gap

        // If the word is beyond the second line, scroll
        if (relativeTop > lineHeight * 1.5) {
            this.wordsContainer.scrollTo({
                top: relativeTop - lineHeight,
                behavior: 'smooth'
            });
        }
    }

    /** Update progress bar / car */
    _updateProgress() {
        let progress = 0;

        switch (this.mode) {
            case 'time':
                progress = (this.timeLimit - this.timeRemaining) / this.timeLimit;
                break;
            case 'words':
                progress = this.currentWordIndex / this.wordLimit;
                break;
            case 'sudden-death':
                progress = this.currentWordIndex / 50; // Arbitrary max
                break;
            case 'zen':
                progress = 0; // No progress in zen
                break;
            default:
                progress = this.currentWordIndex / this.words.length;
        }

        progress = Math.min(1, Math.max(0, progress));

        if (this.progressBar) {
            this.progressBar.style.width = `${progress * 100}%`;
        }
        if (this.progressCar) {
            this.progressCar.style.left = `${progress * 100}%`;
        }
    }

    /** Append more words for zen mode */
    _appendMoreWords() {
        const newWords = getWords('english', 100);
        this.words.push(...newWords);
        this.typedChars.push(...newWords.map(() => []));

        newWords.forEach(word => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word';
            word.split('').forEach(letter => {
                const span = document.createElement('span');
                span.className = 'letter';
                span.textContent = letter;
                wordEl.appendChild(span);
            });
            this.wordsContainer.appendChild(wordEl);
            this.wordElements.push(wordEl);
        });
    }
}
