import ProgressManager from './ProgressManager.js';
import CanvasEngine from './CanvasEngine.js';
import ToneEngine from './ToneEngine.js';
import SoundManager from './SoundManager.js';

class MandarinFlow {
    constructor() {
        this.progress = new ProgressManager();
        this.canvasEngine = null;
        this.toneEngine = null;
        this.soundManager = new SoundManager();
        this.currentView = 'learn';
        this.init();
    }

    async init() {
        this.toneEngine = new ToneEngine(null);
        await this.progress.loadCurriculum();
        this.setupNavigation();
        this.renderView('learn');
        this.updateHeader();

        // Warm up speech and audio
        const warmUp = () => {
            this.soundManager.resume();
            if (window.speechSynthesis) {
                const u = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(u);
            }
            window.removeEventListener('click', warmUp);
            window.removeEventListener('touchstart', warmUp);
        };
        window.addEventListener('click', warmUp);
        window.addEventListener('touchstart', warmUp);
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view !== this.currentView) {
                    this.soundManager.playClick();
                    this.switchView(view);
                }
            });
        });
    }

    switchView(view) {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Transition Logic
        const main = document.getElementById('main-view');
        main.classList.remove('slide-up');
        main.classList.add('slide-down-exit');

        setTimeout(() => {
            this.currentView = view;
            this.renderView(view);
            main.classList.remove('slide-down-exit');
        }, 280); // Slightly less than CSS animation duration
    }

    updateHeader() {
        const stats = this.progress.getStats();
        document.getElementById('xp-badge').textContent = `${stats.xp} XP`;

        const guardianIcon = document.getElementById('guardian-icon');
        const stages = { 'Egg': '🥚', 'Hatchling': '🐥', 'Drakeling': '🐉', 'Dragon': '🐲' };
        guardianIcon.textContent = stages[stats.guardian] || '🥚';
    }

    renderView(view) {
        const main = document.getElementById('main-view');
        main.innerHTML = '';
        main.className = 'p-6 slide-up'; // Reset classes and add entry animation

        switch (view) {
            case 'learn':
                this.renderLearnView(main);
                break;
            case 'practice':
                this.renderPracticeView(main);
                break;
            case 'stats':
                this.renderStatsView(main);
                break;
            case 'settings':
                this.renderSettingsView(main);
                break;
        }
    }

    renderLearnView(container) {
        let html = `
            <div class="space-y-12 pb-24">
                <div class="flex items-center justify-between glass-card p-4 rounded-3xl premium-shadow">
                    <div>
                        <h2 class="text-xs font-black uppercase tracking-tighter text-jade-400">Current Progress</h2>
                        <p class="text-sm font-bold text-jade-800">${this.progress.progress.xp} Total XP</p>
                    </div>
                    <div class="flex items-center gap-2 bg-jade-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black premium-shadow">
                        <span>🔥</span> ${this.progress.progress.streak} DAY STREAK
                    </div>
                </div>
                
                <div class="relative flex flex-col items-center">
                    <!-- Lesson Path Connector -->
                    <div class="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-jade-200 via-jade-100 to-transparent rounded-full z-0 opacity-50"></div>
        `;

        this.progress.curriculum.forEach((level, lIndex) => {
            html += `
                <div class="w-full text-center py-6 mt-8 z-10 relative">
                    <span class="bg-jade-50 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-jade-300">Level ${lIndex + 1}</span>
                    <h3 class="text-sm font-bold text-jade-600 mt-1">${level.title}</h3>
                </div>
            `;

            level.lessons.forEach((lesson, index) => {
                const isEven = index % 2 === 0;
                const offset = isEven ? '-translate-x-12' : 'translate-x-12';
                const charSummary = lesson.items.slice(0, 3).map(i => i.char).join(' ');

                html += `
                    <div class="relative lesson-node z-10 my-6 group">
                        <button class="lesson-btn w-24 h-24 rounded-full jade-gradient border-8 border-white premium-shadow flex flex-col items-center justify-center text-white transform transition-all active:scale-95 duration-500 hover:rotate-6 ${offset} relative" 
                                data-lesson-id="${lesson.id}">
                            <span class="text-3xl float">🏮</span>
                            <div class="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-gold-400 border-4 border-white flex items-center justify-center text-[10px] font-black text-white premium-shadow-gold">
                                ${lesson.items.length}
                            </div>
                        </button>
                        <div class="absolute top-1/2 -translate-y-1/2 ${isEven ? 'left-16 ml-4 text-left' : 'right-16 mr-4 text-right'} w-32">
                            <h4 class="text-xs font-black text-jade-800 uppercase tracking-tight truncate">${lesson.title}</h4>
                            <p class="text-[10px] font-medium text-jade-400 leading-tight">${charSummary}...</p>
                        </div>
                    </div>
                `;
            });
        });

        html += `</div></div>`;
        container.innerHTML = html;

        container.querySelectorAll('.lesson-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.lessonId;
                this.soundManager.playClick();
                btn.classList.add('scale-125', 'opacity-0');
                setTimeout(() => this.startLesson(id), 400);
            });
        });
    }

    renderPracticeView(container) {
        const reviewItems = this.progress.getReviewItems();

        if (reviewItems.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 text-center space-y-8 scale-in">
                    <div class="relative">
                        <div class="text-8xl float">✨</div>
                        <div class="absolute -top-4 -right-4 w-12 h-12 jade-gradient rounded-full border-4 border-white premium-shadow flex items-center justify-center text-white font-black text-xs">OK</div>
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-2xl font-black text-jade-800">Zen State Achieved</h2>
                        <p class="text-jade-400 max-w-xs text-xs font-medium uppercase tracking-widest leading-relaxed">Your memory is currently peak performance. No reviews needed.</p>
                    </div>
                    <button id="go-explore" class="px-8 py-3 rounded-2xl jade-gradient text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl premium-shadow active:scale-95 transition-all">
                        Explore Path
                    </button>
                </div>
            `;
            document.getElementById('go-explore').addEventListener('click', () => {
                this.soundManager.playClick();
                this.switchView('learn')
            });
            return;
        }

        container.innerHTML = `
            <div class="space-y-8 slide-up">
                <div class="glass-card rounded-[2.5rem] p-10 text-center premium-shadow relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative z-10 space-y-6">
                        <div class="inline-flex items-center gap-2 bg-gold-50 text-gold-600 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                            <span class="animate-pulse">●</span> Review Ready
                        </div>
                        <h2 class="text-3xl font-black text-jade-800 tracking-tight">Daily Ritual</h2>
                        <p class="text-jade-400 text-xs font-medium uppercase tracking-widest">Master ${reviewItems.length} characters</p>
                        <button id="start-review" class="w-full py-5 rounded-3xl gold-gradient text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl premium-shadow-gold active:scale-95 transition-all">
                            Burn Incense & Begin
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('start-review').addEventListener('click', () => {
            this.soundManager.playClick();
            this.startReviewSession(reviewItems);
        });
    }

    renderStatsView(container) {
        const stats = this.progress.getStats();
        container.innerHTML = `
            <div class="space-y-8 slide-up">
                <h2 class="text-xs font-black text-jade-300 uppercase tracking-[0.4em] text-center">Your Dragon Spirit</h2>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="glass-card rounded-3xl p-6 text-center premium-shadow">
                        <div class="text-3xl font-black text-jade-700">${stats.charsLearned}</div>
                        <div class="text-[9px] uppercase font-black tracking-widest text-jade-300 mt-1">Learned</div>
                    </div>
                    <div class="glass-card rounded-3xl p-6 text-center premium-shadow">
                        <div class="text-3xl font-black text-gold-500">${stats.streak}</div>
                        <div class="text-[9px] uppercase font-black tracking-widest text-jade-300 mt-1">Streak</div>
                    </div>
                </div>

                <div class="glass-card rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 premium-shadow relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-b from-jade-50/50 to-transparent"></div>
                    <div class="relative">
                        <div class="w-40 h-40 rounded-[2.5rem] jade-gradient border-8 border-white flex items-center justify-center text-7xl premium-shadow-gold guardian-glow float">
                            ${stats.guardian === 'Egg' ? '🥚' : (stats.guardian === 'Hatchling' ? '🐥' : (stats.guardian === 'Drakeling' ? '🐉' : '🐲'))}
                        </div>
                        <div class="absolute -bottom-2 -right-2 bg-gold-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white premium-shadow-gold font-black text-xs">
                            ${Math.floor(stats.xp / 100)}
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <h3 class="text-2xl font-black text-jade-800 tracking-tight">${stats.guardian} Spirit</h3>
                        <p class="text-[10px] font-black text-jade-300 uppercase tracking-[0.2em]">Ascension Progress</p>
                    </div>

                    <div class="w-full space-y-3">
                        <div class="w-full bg-jade-100/50 h-4 rounded-full overflow-hidden border border-white p-1">
                            <div class="bg-gradient-to-r from-gold-400 to-gold-600 h-full rounded-full transition-all duration-1000 shadow-sm" style="width: ${(stats.xp % 500) / 5}%"></div>
                        </div>
                        <p class="text-[9px] text-jade-400 font-bold uppercase tracking-widest">${500 - (stats.xp % 500)} XP TO NEXT EVOLUTION</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettingsView(container) {
        container.innerHTML = `
            <div class="space-y-8 slide-up">
                <h2 class="text-xs font-black text-jade-300 uppercase tracking-[0.4em] text-center">Settings</h2>
                <div class="glass-card rounded-3xl divide-y divide-jade-50 overflow-hidden premium-shadow">
                    <div class="p-6 flex justify-between items-center bg-white/40">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-2xl bg-jade-100 border border-jade-200 flex items-center justify-center text-lg">🔊</div>
                            <span class="font-bold text-jade-800 text-sm">Game Audio</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="audio-toggle" checked class="sr-only peer">
                            <div class="w-11 h-6 bg-jade-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jade-600"></div>
                        </label>
                    </div>
                    <div class="p-6">
                        <button id="reset-data" class="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                            Purge All Data
                        </button>
                    </div>
                </div>
                <div class="text-center space-y-2">
                    <p class="text-[9px] text-jade-200 font-black uppercase tracking-[0.3em]">MandarinFlow Elite v1.3.0</p>
                    <p class="text-[8px] text-jade-100 italic">Built for absolute masters.</p>
                </div>
            </div>
        `;

        const audioToggle = document.getElementById('audio-toggle');
        audioToggle.checked = this.soundManager.enabled;
        audioToggle.addEventListener('change', (e) => {
            this.soundManager.setEnabled(e.target.checked);
        });

        document.getElementById('reset-data').addEventListener('click', () => {
            this.soundManager.playClick();
            if (confirm('Are you sure? This will wipe all your progress forever!')) {
                localStorage.clear();
                window.location.reload();
            }
        });
    }

    // --- Session Flow ---

    startLesson(lessonId) {
        const lesson = this.progress.curriculum.flatMap(l => l.lessons).find(l => l.id === lessonId);
        if (!lesson) return;
        this.runSession(lesson.items);
    }

    startReviewSession(charIds) {
        const items = charIds.map(id => this.findCharById(id)).filter(Boolean);
        this.runSession(items);
    }

    findCharById(id) {
        for (const level of this.progress.curriculum) {
            for (const lesson of level.lessons) {
                const item = lesson.items.find(i => i.id === id);
                if (item) return item;
            }
        }
        return null;
    }

    runSession(items) {
        let currentIndex = 0;
        const main = document.getElementById('main-view');

        const renderStep = () => {
            const item = items[currentIndex];
            main.innerHTML = ''; // Clear previous

            if (item.type === 'sentence') {
                this.renderSentenceChallenge(item, main, () => nextStep());
            } else {
                this.renderCharacterChallenge(item, main, () => nextStep());
            }
        };

        const nextStep = () => {
            currentIndex++;
            if (currentIndex < items.length) {
                renderStep();
            } else {
                this.showSessionComplete();
            }
        };

        renderStep();
    }

    renderCharacterChallenge(item, container, onComplete) {
        container.innerHTML = `
            <div class="space-y-8 flex flex-col items-center slide-up pb-20">
                <div class="flex justify-between w-full items-center">
                    <button id="exit-session" class="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center text-jade-400 premium-shadow">✕</button>
                    <div class="flex-1 px-6">
                        <div class="h-1.5 bg-jade-100 rounded-full overflow-hidden">
                            <div class="h-full bg-jade-600 rounded-full transition-all duration-700 w-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div class="text-center space-y-4">
                    <span class="text-jade-400 text-[9px] font-black uppercase tracking-[0.3em]">Imperial Archives</span>
                    <div class="space-y-2">
                        <h2 class="text-7xl hanzi text-jade-800 drop-shadow-sm scale-in">${item.char}</h2>
                        <div class="flex items-center justify-center gap-3">
                            <span class="text-2xl font-black text-gold-500 tracking-tight">${item.pinyin}</span>
                            <button id="play-audio-btn" class="w-10 h-10 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center active:scale-95 transition-all premium-shadow-gold">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p class="text-jade-400 italic text-sm font-medium tracking-tight">"${item.meaning}"</p>
                </div>

                ${!this.toneEngine.hasMandarinVoice() ? `
                    <div class="bg-amber-50/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-4 text-[10px] text-amber-700 flex items-start gap-3 max-w-[300px] scale-in">
                        <span class="text-xl">💡</span>
                        <div class="space-y-1">
                            <p class="font-black uppercase tracking-wider">Voice Not Found</p>
                            <p class="leading-relaxed opacity-80">Install the Chinese language pack in system settings for full immersion.</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Drawing Portal -->
                <div class="relative w-full aspect-square max-w-[320px] glass-card rounded-[3rem] overflow-hidden premium-shadow group">
                    <canvas id="drawing-canvas" width="320" height="320" class="w-full h-full cursor-crosshair relative z-10"></canvas>
                    <div id="tone-area" class="absolute inset-0 hidden p-6 flex flex-col justify-center z-20 bg-white/90 backdrop-blur-md"></div>
                    <!-- Background Grid -->
                    <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 z-0 opacity-10">
                        <div class="border-r border-b border-jade-900"></div>
                        <div class="border-b border-jade-900"></div>
                        <div class="border-r border-jade-900"></div>
                        <div class=""></div>
                    </div>
                </div>

                <div class="w-full px-4 pt-4">
                    <button id="validate-btn" class="w-full py-5 rounded-[2rem] jade-gradient text-white font-black text-xs uppercase tracking-[0.3em] premium-shadow active:scale-[0.98] transition-all relative overflow-hidden">
                        <span class="relative z-10">Transcribe Character</span>
                        <div class="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </div>
        `;

        this.canvasEngine = new CanvasEngine('drawing-canvas');
        this.toneEngine = new ToneEngine('tone-area');

        this.canvasEngine.drawGhost(item.char);

        document.getElementById('play-audio-btn').addEventListener('click', () => {
            this.soundManager.playClick();
            this.toneEngine.playAudio(item.char);
        });

        document.getElementById('exit-session').addEventListener('click', () => {
            this.soundManager.playClick();
            this.renderView(this.currentView);
        });

        document.getElementById('validate-btn').addEventListener('click', async () => {
            const btn = document.getElementById('validate-btn');
            this.soundManager.playClick();
            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="animate-pulse tracking-widest">INVOKING...</span>';

            const result = await this.canvasEngine.predict();

            if (result.match) {
                this.showSuccess(item);
                this.progress.updateMastery(item.id, 5);
                this.updateHeader();

                setTimeout(() => {
                    onComplete();
                }, 1800);
            } else {
                this.showFailure();
                btn.disabled = false;
                btn.innerHTML = originalText;
                this.progress.updateMastery(item.id, 1);
            }
        });
    }

    renderSentenceChallenge(item, container, onComplete) {
        // Shuffle tokens for the puzzle
        const shuffled = [...item.tokens].sort(() => Math.random() - 0.5);
        let userSelection = []; // Array of { id, text }

        // Helper to refresh the puzzle UI state
        const refreshUI = () => {
            // We need to re-render the whole Puzzle View if we want to be clean, 
            // but let's just update the two containers to avoid flicker.

            // 1. Render Target Slots
            const slotContainer = document.getElementById('target-slots');
            slotContainer.innerHTML = '';

            if (userSelection.length === 0) {
                slotContainer.innerHTML = '<span class="text-jade-300 text-xs italic font-medium opacity-60">Tap words to arrange them</span>';
            } else {
                userSelection.forEach((tok, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'word-stone px-4 py-3 bg-white border-b-4 border-jade-200 rounded-xl text-lg font-black text-jade-800 premium-shadow pop-in hover:-translate-y-1 transition-transform';
                    btn.textContent = tok.text;
                    btn.onclick = () => {
                        this.soundManager.playClick();
                        userSelection.splice(idx, 1);
                        refreshUI();
                    };
                    slotContainer.appendChild(btn);
                });
            }

            // 2. Render Source Bank
            const bankContainer = document.getElementById('source-tokens');
            bankContainer.innerHTML = '';

            // Create a pool of available tokens (all tokens minus those currentlySelected by ID)
            // We need to track unique instances because a sentence might have duplicate words "ta ta"
            // So we use unique IDs for tokens.

            availableTokens.forEach(tok => {
                // If token is in userSelection, don't show it in bank
                if (userSelection.find(s => s.uid === tok.uid)) return;

                const btn = document.createElement('button');
                btn.className = 'word-stone px-4 py-3 bg-jade-100 border-b-4 border-jade-200 rounded-xl text-lg font-bold text-jade-700 shadow-sm active:scale-95 transition-all';
                btn.textContent = tok.text;
                btn.onclick = () => {
                    this.soundManager.playClick();
                    userSelection.push(tok);
                    refreshUI();
                };
                bankContainer.appendChild(btn);
            });

            // 3. Update Check Button
            const checkBtn = document.getElementById('check-btn');
            const isComplete = userSelection.length === item.tokens.length;
            checkBtn.disabled = !isComplete;
            if (isComplete) {
                checkBtn.classList.remove('opacity-50', 'grayscale');
            } else {
                checkBtn.classList.add('opacity-50', 'grayscale');
            }
        };

        // Prepare tokens with unique IDs
        const availableTokens = shuffled.map((text, idx) => ({ uid: idx, text }));

        // Initial Layout
        container.innerHTML = `
            <div class="space-y-8 flex flex-col items-center slide-up pb-20 w-full">
                <div class="flex justify-between w-full items-center">
                    <button id="exit-session" class="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center text-jade-400 premium-shadow">✕</button>
                    <span class="text-[10px] font-black text-jade-300 uppercase tracking-widest">SENTENCE CONSTRUCTION</span>
                </div>

                <div class="text-center space-y-4">
                    <span class="text-jade-400 text-[9px] font-black uppercase tracking-[0.3em]">Meaning</span>
                    <div class="bg-white/40 p-6 rounded-3xl border border-white/20 premium-shadow">
                        <h2 class="text-xl font-bold text-jade-800 opacity-90 leading-relaxed">"${item.meaning}"</h2>
                    </div>
                     <button id="play-sentence-audio" class="w-12 h-12 mt-4 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center active:scale-95 transition-all premium-shadow-gold mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                </div>

                <!-- Construction Zone -->
                <div class="w-full space-y-2">
                     <p class="text-[9px] font-black text-jade-300 uppercase tracking-widest text-center">Your Formation</p>
                    <div class="slot-container flex flex-wrap gap-2 justify-center p-4 bg-jade-50/50 rounded-2xl min-h-[100px] items-center transition-all" id="target-slots">
                        <!-- Filled by JS -->
                    </div>
                </div>

                <!-- Word Bank -->
                <div class="flex flex-wrap gap-3 justify-center p-2 mb-10 min-h-[80px]" id="source-tokens">
                    <!-- Filled by JS -->
                </div>

                <div class="w-full px-4 pt-4 mt-auto">
                    <button id="check-btn" class="w-full py-5 rounded-[2rem] jade-gradient text-white font-black text-xs uppercase tracking-[0.3em] premium-shadow active:scale-[0.98] transition-all opacity-50 grayscale" disabled>
                        Verify Alignment
                    </button>
                </div>
            </div>
        `;

        document.getElementById('exit-session').addEventListener('click', () => {
            this.soundManager.playClick();
            this.renderView(this.currentView);
        });

        document.getElementById('play-sentence-audio').addEventListener('click', () => {
            this.soundManager.playClick();
            this.toneEngine.playAudio(item.chinese);
        });

        document.getElementById('check-btn').addEventListener('click', () => {
            const attempt = userSelection.map(t => t.text).join('');
            if (attempt === item.chinese || attempt === item.chinese.replace(/\s/g, '')) {
                // Success
                this.soundManager.playSuccess();
                confetti({
                    particleCount: 150, spread: 80, origin: { y: 0.6 },
                    colors: ['#2d5a27', '#f59e0b', '#ffffff'], ticks: 200
                });

                const toast = document.createElement('div');
                toast.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-500 font-black text-4xl uppercase tracking-widest drop-shadow-sm scale-in whitespace-nowrap z-50 pointer-events-none';
                toast.innerText = 'Excellent!';
                document.getElementById('main-view').appendChild(toast);

                setTimeout(onComplete, 1500);
            } else {
                // Failure
                this.soundManager.playError();
                const container = document.getElementById('target-slots');
                container.classList.add('shake');
                setTimeout(() => container.classList.remove('shake'), 500);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        });

        refreshUI();
    }

    showSuccess(item) {
        this.soundManager.playSuccess();
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#2d5a27', '#f59e0b', '#fbbf24', '#ffffff'],
            gravity: 0.8,
            ticks: 300
        });

        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

        const toneArea = document.getElementById('tone-area');
        const canvas = document.getElementById('drawing-canvas');
        canvas.classList.add('hidden');
        toneArea.classList.remove('hidden');
        toneArea.classList.add('scale-in');

        this.toneEngine.renderToneSelector((tone) => {
            if (tone === item.tone) {
                this.toneEngine.highlightTone(tone);
                this.toneEngine.playAudio(item.char);
            }
        });

        // Add visual success toast
        const toast = document.createElement('div');
        toast.className = 'absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-500 font-black text-4xl uppercase tracking-widest drop-shadow-sm scale-in whitespace-nowrap z-50 pointer-events-none';
        toast.innerText = ['Divine!', 'Perfect!', 'Sublime!', 'Masterful!'][Math.floor(Math.random() * 4)];
        document.getElementById('main-view').appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    }

    showFailure() {
        this.soundManager.playError();
        const container = document.getElementById('drawing-canvas').parentElement;
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }

    showSessionComplete() {
        this.soundManager.playLevelUp();
        const main = document.getElementById('main-view');
        main.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-center space-y-10 scale-in min-h-[70vh]">
                <div class="relative">
                    <div class="text-9xl float">🐲</div>
                    <div class="absolute -top-6 -right-6 w-24 h-24 gold-gradient rounded-full flex items-center justify-center border-8 border-white premium-shadow-gold guardian-glow rotate-12 z-20">
                        <span class="text-white font-black text-xl drop-shadow-md">+100</span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h2 class="text-4xl font-black text-jade-800 tracking-tight">Enlightenment Achieved</h2>
                    <p class="text-jade-400 text-xs font-bold uppercase tracking-[0.3em]">The Dragon Spirit is pleased</p>
                </div>

                <div class="w-full glass-card rounded-[2.5rem] p-8 space-y-6 premium-shadow">
                    <div class="flex justify-around items-center divide-x divide-jade-50">
                        <div class="flex-1">
                            <p class="text-[9px] font-black text-jade-300 uppercase tracking-widest mb-1">XP Gain</p>
                            <p class="text-2xl font-black text-gold-600">+100</p>
                        </div>
                        <div class="flex-1">
                            <p class="text-[9px] font-black text-jade-300 uppercase tracking-widest mb-1">Accuracy</p>
                            <p class="text-2xl font-black text-jade-700">100%</p>
                        </div>
                    </div>
                    
                    <button id="finish-btn" class="w-full py-5 rounded-[2rem] jade-gradient text-white font-black text-xs uppercase tracking-[0.4em] premium-shadow active:scale-95 transition-all">
                        Ascend to Path
                    </button>
                </div>
            </div>
        `;

        document.getElementById('finish-btn').addEventListener('click', () => {
            this.renderView('learn');
        });
    }
}

// Start the app
window.mandarinFlow = new MandarinFlow();
