import ProgressManager from './ProgressManager.js';
import CanvasEngine from './CanvasEngine.js';
import ToneEngine from './ToneEngine.js';

class MandarinFlow {
    constructor() {
        this.progress = new ProgressManager();
        this.canvasEngine = null;
        this.toneEngine = null;
        this.currentView = 'learn';
        this.init();
    }

    async init() {
        await this.progress.loadCurriculum();
        this.setupNavigation();
        this.renderView('learn');
        this.updateHeader();

        // Warm up speech synthesis on first user interaction (critical for mobile)
        const warmUpSpeech = () => {
            if (window.speechSynthesis) {
                const u = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(u);
            }
            window.removeEventListener('click', warmUpSpeech);
            window.removeEventListener('touchstart', warmUpSpeech);
        };
        window.addEventListener('click', warmUpSpeech);
        window.addEventListener('touchstart', warmUpSpeech);
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }

    switchView(view) {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        this.currentView = view;
        this.renderView(view);
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
        main.className = 'p-6 fade-in';

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
            <div class="space-y-8 pb-10">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-jade-800">Learning Path</h2>
                    <div class="flex items-center gap-2 text-jade-500 font-bold text-sm">
                        <span>🔥</span> ${this.progress.progress.streak} Day Streak
                    </div>
                </div>
                <div class="relative flex flex-col items-center space-y-12">
        `;

        // Draw the vertical vertical lesson path
        this.progress.curriculum.forEach((level, lIndex) => {
            html += `<div class="w-full text-center py-4 text-jade-400 font-bold uppercase tracking-widest text-xs">${level.title}</div>`;

            level.lessons.forEach((lesson, index) => {
                const isEven = index % 2 === 0;
                const offset = isEven ? '-translate-x-12' : 'translate-x-12';

                html += `
                    <div class="relative lesson-node group">
                        <button class="lesson-btn w-20 h-20 rounded-full jade-gradient border-4 border-white shadow-lg flex items-center justify-center text-white transform transition-all active:scale-90 hover:scale-105 ${offset}" 
                                data-lesson-id="${lesson.id}">
                            <span class="text-2xl">🏮</span>
                            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-jade-700 font-bold text-[10px] bg-white px-2 py-1 rounded-full shadow-sm">
                                ${lesson.title}
                            </div>
                        </button>
                    </div>
                `;
            });
        });

        html += `</div></div>`;
        container.innerHTML = html;

        container.querySelectorAll('.lesson-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startLesson(btn.dataset.lessonId));
        });
    }

    renderPracticeView(container) {
        const reviewItems = this.progress.getReviewItems();

        if (reviewItems.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div class="text-6xl">✨</div>
                    <h2 class="text-2xl font-bold text-jade-800">You're all caught up!</h2>
                    <p class="text-jade-500 max-w-xs text-sm">Your memory is fresh. Go learn some new characters or come back later for your next review session.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-6">
                <div class="glass-card rounded-3xl p-8 text-center">
                    <h2 class="text-xl font-bold text-jade-800 mb-2">Daily Review</h2>
                    <p class="text-jade-500 text-sm mb-6">Master ${reviewItems.length} characters ready for review.</p>
                    <button id="start-review" class="w-full py-4 rounded-2xl gold-gradient text-white font-bold shadow-lg shadow-gold-200 active:scale-95 transition-transform">
                        Start Review Session
                    </button>
                </div>
            </div>
        `;

        document.getElementById('start-review').addEventListener('click', () => this.startReviewSession(reviewItems));
    }

    renderStatsView(container) {
        const stats = this.progress.getStats();
        container.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-jade-800">Your Journey</h2>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class=" glass-card rounded-2xl p-4 text-center">
                        <div class="text-2xl font-bold text-jade-600">${stats.charsLearned}</div>
                        <div class="text-[10px] uppercase font-bold text- jade-400">Characters Known</div>
                    </div>
                    <div class="glass-card rounded-2xl p-4 text-center">
                        <div class="text-2xl font-bold text-gold-500">${stats.streak}</div>
                        <div class="text-[10px] uppercase font-bold text-jade-400">Day Streak</div>
                    </div>
                </div>

                <div class="glass-card rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
                    <div class="w-32 h-32 rounded-full jade-gradient border-8 border-gold-400 flex items-center justify-center text-6xl guardian-pulse">
                        ${stats.guardian === 'Egg' ? '🥚' : (stats.guardian === 'Hatchling' ? '🐥' : (stats.guardian === 'Drakeling' ? '🐉' : '🐲'))}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-jade-800">${stats.guardian} Spirit</h3>
                        <p class="text-jade-500 text-xs">Total XP: ${stats.xp}</p>
                    </div>
                    <div class="w-full bg-jade-100 h-3 rounded-full overflow-hidden">
                        <div class="bg-gold-400 h-full" style="width: ${(stats.xp % 500) / 5}%"></div>
                    </div>
                    <p class="text-[10px] text-jade-400 font-bold uppercase">Next Evolution: ${500 - (stats.xp % 500)} XP Away</p>
                </div>
            </div>
        `;
    }

    renderSettingsView(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-jade-800">Settings</h2>
                <div class="glass-card rounded-2xl divide-y divide-jade-100">
                    <div class="p-4 flex justify-between items-center">
                        <span class="font-medium">Audio Feedback</span>
                        <input type="checkbox" checked class="w-6 h-6 border-jade-300 text-jade-600 rounded">
                    </div>
                    <div class="p-4 flex justify-between items-center">
                        <span class="font-medium">Haptic Feedback</span>
                        <input type="checkbox" checked class="w-6 h-6 border-jade-300 text-jade-600 rounded">
                    </div>
                    <div class="p-4">
                        <button id="reset-data" class="text-red-500 font-bold text-sm">Reset All Progress</button>
                    </div>
                </div>
                <div class="text-center text-[10px] text-jade-300 font-bold uppercase tracking-widest">
                    MandarinFlow v1.0.0
                </div>
            </div>
        `;

        document.getElementById('reset-data').addEventListener('click', () => {
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
            main.innerHTML = `
                <div class="space-y-6 flex flex-col items-center">
                    <div class="flex justify-between w-full items-center">
                        <button id="exit-session" class="text-jade-400">✕</button>
                        <div class="flex-1 px-8">
                            <div class="h-2 bg-jade-100 rounded-full">
                                <div class="h-full bg-jade-600 rounded-full transition-all" style="width: ${(currentIndex / items.length) * 100}%"></div>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-jade-400">${currentIndex + 1}/${items.length}</span>
                    </div>

                    <div class="text-center space-y-2">
                        <span class="text-jade-500 text-xs font-bold uppercase tracking-widest">Review Character</span>
                        <h2 class="text-7xl hanzi text-jade-800">${item.char}</h2>
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-2xl font-bold text-gold-600">${item.pinyin}</span>
                            <button id="play-audio-btn" class="bg-jade-100 p-3 rounded-full text-jade-600 active:scale-90 transition-transform shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                        <p class="text-jade-500 italic">"${item.meaning}"</p>
                    </div>

                    <!-- Canvas/Interaction Area -->
                    <div class="relative w-full aspect-square max-w-[300px] glass-card rounded-3xl overflow-hidden shadow-jade-100/50">
                        <canvas id="drawing-canvas" width="300" height="300" class="w-full h-full cursor-crosshair"></canvas>
                        <div id="tone-area" class="absolute inset-0 hidden p-4 flex flex-col justify-center"></div>
                    </div>

                    <button id="validate-btn" class="w-full py-4 rounded-2xl jade-gradient text-white font-bold shadow-lg shadow-jade-200 active:scale-95 transition-transform">
                        Check Result
                    </button>
                </div>
            `;

            this.canvasEngine = new CanvasEngine('drawing-canvas');
            this.toneEngine = new ToneEngine('tone-area');

            this.canvasEngine.drawGhost(item.char);

            // Audio listener
            document.getElementById('play-audio-btn').addEventListener('click', () => {
                this.toneEngine.playAudio(item.char);
            });

            document.getElementById('exit-session').addEventListener('click', () => {
                this.renderView(this.currentView);
            });

            document.getElementById('validate-btn').addEventListener('click', async () => {
                const btn = document.getElementById('validate-btn');
                btn.disabled = true;
                btn.innerHTML = '<span class="animate-pulse">Thinking...</span>';

                const result = await this.canvasEngine.predict();

                if (result.match) {
                    this.showSuccess(item);
                    this.progress.updateMastery(item.id, 5);
                    this.updateHeader();

                    setTimeout(() => {
                        currentIndex++;
                        if (currentIndex < items.length) {
                            renderStep();
                        } else {
                            this.showSessionComplete();
                        }
                    }, 1500);
                } else {
                    this.showFailure();
                    btn.disabled = false;
                    btn.textContent = 'Try Again';
                    this.progress.updateMastery(item.id, 1);
                }
            });
        };

        renderStep();
    }

    showSuccess(item) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2d5a27', '#eab308', '#ffffff']
        });

        if (navigator.vibrate) navigator.vibrate(50);

        // Transition to tone selector for extra points (optional gamification)
        const toneArea = document.getElementById('tone-area');
        const canvas = document.getElementById('drawing-canvas');
        canvas.classList.add('hidden');
        toneArea.classList.remove('hidden');

        this.toneEngine.renderToneSelector((tone) => {
            if (tone === item.tone) {
                this.toneEngine.highlightTone(tone);
                this.toneEngine.playAudio(item.char);
            }
        });
    }

    showFailure() {
        const container = document.getElementById('drawing-canvas').parentElement;
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }

    showSessionComplete() {
        const main = document.getElementById('main-view');
        main.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-center space-y-6 fade-in">
                <div class="relative">
                    <div class="text-8xl">🏆</div>
                    <div class="absolute -top-4 -right-4 bg-gold-400 text-white p-2 rounded-full text-xs font-bold">+100 XP</div>
                </div>
                <h2 class="text-2xl font-bold text-jade-800">Session Complete!</h2>
                <p class="text-jade-500 text-sm">You've strengthened your connection with your Inner Dragon.</p>
                <button id="finish-btn" class="w-full py-4 rounded-2xl jade-gradient text-white font-bold shadow-lg">
                    Return to Path
                </button>
            </div>
        `;

        document.getElementById('finish-btn').addEventListener('click', () => {
            this.renderView('learn');
        });
    }
}

// Start the app
window.mandarinFlow = new MandarinFlow();
