/**
 * FRONTEND: CONTROLLER
 * Manages App State, Timer, Audio, and UI Events.
 */
class WorkoutApp {
    constructor() {
        this.db = new DataManager();
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.synth = window.speechSynthesis;

        this.state = {
            activeDay: new Date().getDay(),
            isSessionActive: false,
            isEditing: false,
            sessionSeconds: 0,
            timerIntv: null,
            currentList: [],
            warmupRoutine: [
                { id: "wm1", name: "Arm Circles", reps: 30, unit: "Sec", icon: "fa-sync", rest: 10 },
                { id: "wm2", name: "Jumping Jacks", reps: 20, unit: "Reps", icon: "fa-star", rest: 15 }
            ]
        };

        this.init();
    }

    init() {
        this.applyTheme(this.db.profile.theme);
        if (this.db.profile.mode === 'light') {
            this.toggleLightMode(true);
            $('#light-mode-toggle').prop('checked', true);
        }

        // Migrate old data format (reps/unit -> time/target)
        this.migrateOldData();

        this.checkStreak();
        this.bindEvents();
        this.loadDay(this.state.activeDay);
        this.updateSettingsUI();
        $('#warmup-toggle').prop('checked', this.db.profile.warmup);
        this.updateAudioIcon();
    }

    migrateOldData() {
        let needsSave = false;
        Object.keys(this.db.schedule).forEach(dayKey => {
            const day = this.db.schedule[dayKey];
            if (day.exercises) {
                day.exercises.forEach(ex => {
                    // If exercise has old format (reps/unit but no time/target)
                    if (ex.reps !== undefined && ex.time === undefined) {
                        ex.time = (ex.unit && ex.unit.toLowerCase().includes('sec')) ? ex.reps : 30;
                        ex.target = (ex.unit && ex.unit.toLowerCase().includes('sec')) ? 1 : ex.reps || 15;
                        delete ex.reps;
                        delete ex.unit;
                        needsSave = true;
                    }
                });
            }
        });
        if (needsSave) {
            this.db.save('SCHED', this.db.schedule);
            console.log('Migrated old schedule format to time/target');
        }
    }

    // --- LOGIC ---
    loadDay(dayIdx) {
        this.state.activeDay = parseInt(dayIdx);
        this.renderWeekNav();

        const dayData = this.db.schedule[this.state.activeDay];
        $('#day-focus').text(dayData.focus);
        $('.muscle-part').removeClass('muscle-active');
        dayData.muscles.forEach(m => $(`.muscle-part[data-muscle="${m}"]`).addClass('muscle-active'));

        this.buildQueue();
        this.renderList();
        this.updateProgress();
    }

    buildQueue() {
        const base = this.db.schedule[this.state.activeDay].exercises;
        this.state.currentList = (this.db.profile.warmup && !this.state.isEditing)
            ? [...this.state.warmupRoutine, ...base]
            : [...base];
    }

    toggleSession() {
        if (this.state.isSessionActive) {
            if (confirm("End current session?")) this.endSession(true);
        } else {
            this.startSession();
        }
    }

    startSession() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.state.isSessionActive = true;

        // UI Updates
        $('#main-action-btn').html('<i class="fas fa-stop mr-2"></i> End Session').addClass('bg-red-500').removeClass('gradient-bg');
        $('#reset-day-btn').addClass('opacity-0 pointer-events-none');
        $('#quick-warmup-container').fadeOut();
        $('#timer-label').text("Active");

        if (this.state.isEditing) this.toggleEditMode(); // Exit edit mode

        this.state.sessionSeconds = 0;
        this.state.fsExerciseIndex = 0;
        clearInterval(this.state.timerIntv);
        this.state.timerIntv = setInterval(() => {
            this.state.sessionSeconds++;
            const m = Math.floor(this.state.sessionSeconds / 60).toString().padStart(2, '0');
            const s = (this.state.sessionSeconds % 60).toString().padStart(2, '0');
            $('#global-timer, #gym-timer, #fs-session-timer').text(`${m}:${s}`);
        }, 1000);

        this.showToast("Session Started");
        this.speak("Session started.");
        this.renderList();
        this.updateGymMode();

        // Launch fullscreen mode
        this.startFullscreenWorkout();
    }

    endSession(userAction = true) {
        this.state.isSessionActive = false;
        clearInterval(this.state.timerIntv);

        $('#main-action-btn').html('<i class="fas fa-play mr-2"></i> Start Session').addClass('gradient-bg').removeClass('bg-red-500');
        $('#reset-day-btn').removeClass('opacity-0 pointer-events-none');
        $('#quick-warmup-container').fadeIn();
        $('#global-timer').text("00:00");
        $('#timer-label').text("Duration");
        $('#gym-name').text("START"); $('#gym-target').text("--"); $('#gym-unit').text("--");

        if (userAction) this.showToast("Session Stopped");
        this.renderList();
    }

    completeExercise(id, btnEl) {
        const day = this.state.activeDay;
        if (!this.db.completed[day]) this.db.completed[day] = [];

        if (!this.db.completed[day].includes(id)) {
            this.db.completed[day].push(id);
            this.db.save('COMP', this.db.completed);
        }

        $(`#card-${id}`).addClass('completed');
        if (btnEl) {
            btnEl.replaceWith(`<div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center shadow-lg"><i class="fas fa-check text-white"></i></div>`);
        }
        if (navigator.vibrate) navigator.vibrate(50);

        this.updateProgress();
        this.updateGymMode();

        const remaining = this.state.currentList.filter(e => !this.db.completed[day].includes(e.id));
        if (remaining.length > 0) {
            this.triggerRest(remaining[0]);
            setTimeout(() => { document.getElementById('card-' + remaining[0].id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 600);
        } else {
            this.finishSession();
        }
    }

    triggerRest(nextEx) {
        $('#rest-modal').removeClass('hidden');
        $('#next-ex-name').text(nextEx.name);
        this.speak("Rest.");

        let time = nextEx.rest || 30;
        $('#rest-timer').text(time);

        const intv = setInterval(() => {
            time--;
            $('#rest-timer').text(time);
            if (time <= 3 && time > 0) this.playSound("beep");
            if (time <= 0) {
                clearInterval(intv);
                $('#rest-modal').addClass('hidden');
                this.speak("Start!");
            }
        }, 1000);

        // Button Handlers
        $('#skip-rest').off().one('click', () => { clearInterval(intv); $('#rest-modal').addClass('hidden'); });
        $('#add-time').off().click(() => { time += 15; $('#rest-timer').text(time); });
    }

    finishSession() {
        this.updateStreak(true);
        this.db.history.unshift({ date: new Date().toLocaleString(), focus: this.db.schedule[this.state.activeDay].focus, time: $('#global-timer').text() });
        if (this.db.history.length > 20) this.db.history.pop();
        this.db.save('HIST', this.db.history);

        this.endSession(false);
        this.fireConfetti();
        this.speak("Session Complete!");
        this.checkAchievements();
        setTimeout(() => $('#overload-modal').removeClass('hidden'), 500);
    }

    toggleEditMode() {
        if (this.state.isSessionActive) { this.showToast("Stop session to edit!"); return; }
        this.state.isEditing = !this.state.isEditing;

        const btn = $('#toggle-edit');
        if (this.state.isEditing) {
            btn.html('<i class="fas fa-check text-green-400"></i>').addClass('border-green-400');
            $('#action-bar').addClass('hidden-bar');
            $('#quick-warmup-container').addClass('opacity-0 pointer-events-none');
            this.showToast("Edit Mode Active");
        } else {
            this.saveEdits();
            btn.html('<i class="fas fa-pencil-alt text-sm"></i>').removeClass('border-green-400');
            $('#action-bar').removeClass('hidden-bar');
            $('#quick-warmup-container').removeClass('opacity-0 pointer-events-none');
            this.showToast("Changes Saved");
        }
        this.renderList();
    }

    saveEdits() {
        $('.edit-name').each((i, el) => {
            const id = $(el).data('id');
            const ex = this.db.schedule[this.state.activeDay].exercises.find(e => e.id === id);
            if (ex) ex.name = $(el).val();
        });
        $('.edit-time').each((i, el) => {
            const id = $(el).data('id');
            const ex = this.db.schedule[this.state.activeDay].exercises.find(e => e.id === id);
            if (ex) ex.time = parseInt($(el).val());
        });
        $('.edit-target').each((i, el) => {
            const id = $(el).data('id');
            const ex = this.db.schedule[this.state.activeDay].exercises.find(e => e.id === id);
            if (ex) ex.target = parseInt($(el).val());
        });
        this.db.save('SCHED', this.db.schedule);
        this.buildQueue();
    }

    // --- RENDERING ---
    renderWeekNav() {
        const container = $('#day-nav-container').empty();
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach((d, i) => {
            const activeClass = (i === this.state.activeDay) ? 'active' : 'glass-panel text-slate-400';
            const hasData = this.db.completed[i] && this.db.completed[i].length === this.db.schedule[i].exercises.length;
            container.append(`<button class="day-btn w-10 h-14 rounded-xl flex flex-col items-center justify-center relative shrink-0 ${activeClass}" data-day="${i}"><span class="text-[9px] uppercase font-bold opacity-60">${d}</span><span class="text-lg font-black">${i === new Date().getDay() ? '★' : new Date().getDate() + (i - new Date().getDay())}</span>${hasData ? '<div class="status-dot"></div>' : ''}</button>`);
        });
        // Rebind
        $('.day-btn').click((e) => this.loadDay($(e.currentTarget).data('day')));
    }

    renderList() {
        const container = $('#workout-list').empty();
        const source = this.state.isEditing ? this.db.schedule[this.state.activeDay].exercises : this.state.currentList;

        if (source.length === 0) { container.html('<div class="text-center text-slate-500 py-10">No exercises.</div>'); return; }

        source.forEach((ex, idx) => {
            const isDone = this.db.completed[this.state.activeDay]?.includes(ex.id);
            const time = Math.ceil((ex.time || 30) * this.db.profile.level);
            const target = Math.ceil((ex.target || 10) * this.db.profile.level);
            const isWarmup = ex.id.startsWith('wm');
            const isHold = ex.target === 1; // Plank, Wall Sit, etc.

            if (this.state.isEditing) {
                container.append(`
                    <div class="glass-panel p-4 rounded-3xl grid grid-cols-12 gap-2 anim-enter" style="animation-delay: ${idx * 0.05}s">
                        <div class="col-span-5"><label class="text-[9px] text-slate-500 uppercase">Name</label><input type="text" class="edit-input edit-name" value="${ex.name}" data-id="${ex.id}"></div>
                        <div class="col-span-4"><label class="text-[9px] text-slate-500 uppercase">Time(s)</label><input type="number" class="edit-input edit-time" value="${ex.time}" data-id="${ex.id}"></div>
                        <div class="col-span-3"><label class="text-[9px] text-slate-500 uppercase">Target</label><input type="number" class="edit-input edit-target" value="${ex.target}" data-id="${ex.id}"></div>
                    </div>`);
            } else {
                let btnHtml = '';
                if (!this.state.isSessionActive) btnHtml = `<div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500"><i class="fas fa-lock text-xs"></i></div>`;
                else if (isDone) btnHtml = `<div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center shadow-lg"><i class="fas fa-check text-white"></i></div>`;
                else btnHtml = `<button class="timer-btn w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white active:scale-90 transition" data-id="${ex.id}" data-time="${time}" data-target="${target}" data-ishold="${isHold}"><i class="fas fa-play text-xs"></i></button>`;

                const badge = isWarmup ? `<span class="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded ml-2 uppercase font-bold">Warmup</span>` : '';
                const displayInfo = isHold ? `${time}s` : `${time}s | Target: ${target}`;
                container.append(`
                    <div class="glass-panel p-5 rounded-[1.8rem] transition-all duration-300 ${isDone ? 'completed' : ''} anim-enter" id="card-${ex.id}" style="animation-delay: ${idx * 0.05}s">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white gradient-bg shadow-lg"><i class="fas ${ex.icon}"></i></div>
                                <div><div class="flex items-center"><h3 class="font-bold text-white uppercase text-sm tracking-tight">${ex.name}</h3>${badge}</div><p class="text-slate-400 font-bold text-xs uppercase dynamic-text-${ex.id}">${displayInfo}</p></div>
                            </div>
                            ${btnHtml}
                        </div>
                    </div>`);
            }
        });
    }

    updateProgress() {
        const total = this.state.currentList.length;
        const done = this.state.currentList.filter(e => this.db.completed[this.state.activeDay]?.includes(e.id)).length;
        const pct = Math.round((done / total) * 100) || 0;
        $('#percent-text').text(pct + '%');
        $('#mini-progress').css('width', pct + '%');
        if (done === total && total > 0) this.renderWeekNav();
    }

    updateGymMode() {
        if (!this.state.isSessionActive) return;
        const nextEx = this.state.currentList.find(e => !this.db.completed[this.state.activeDay]?.includes(e.id));
        if (nextEx) {
            $('#gym-name').text(nextEx.name);
            $('#gym-target').text(Math.ceil((nextEx.time || 30) * this.db.profile.level) + "s");
            $('#gym-unit').text("Target: " + Math.ceil((nextEx.target || 10) * this.db.profile.level));
        } else {
            $('#gym-name').text("DONE"); $('#gym-target').text("✔"); $('#gym-unit').text("");
        }
    }

    // --- EVENTS & UTILS ---
    bindEvents() {
        $('#main-action-btn').click(() => this.toggleSession());
        $('#toggle-edit').click(() => this.toggleEditMode());

        $(document).on('click', '.check-btn', (e) => this.completeExercise($(e.currentTarget).data('id'), $(e.currentTarget)));
        $(document).on('click', '.timer-btn', (e) => {
            const btn = $(e.currentTarget); if (btn.hasClass('running')) return;
            btn.addClass('running gradient-bg border-transparent text-white');

            let timeLeft = parseInt(btn.data('time'));
            const targetReps = parseInt(btn.data('target'));
            const exId = btn.data('id');
            const isHold = btn.data('ishold') === 'true' || btn.data('ishold') === true;
            const label = $(`.dynamic-text-${exId}`);

            this.speak("Go");

            const intv = setInterval(() => {
                timeLeft--;
                btn.html(`<span class="text-xs font-black text-white">${timeLeft}</span>`);
                label.text(timeLeft + "s left").addClass('gradient-text');
                if (timeLeft <= 3 && timeLeft > 0) this.playSound("beep");
                if (timeLeft <= 0) {
                    clearInterval(intv);
                    btn.html('<i class="fas fa-play text-xs"></i>').removeClass('running gradient-bg');

                    if (isHold) {
                        // Hold exercises (Plank, Wall Sit) - auto-complete
                        this.completeExercise(exId, btn);
                    } else {
                        // Rep-based - ask user for reps
                        this.showRepInput(exId, targetReps, btn);
                    }
                }
            }, 1000);
        });

        // Settings & Modals
        $('.tab-btn').click((e) => {
            const tabId = $(e.currentTarget).data('tab');
            $('.tab-content').removeClass('active');
            $('.tab-btn').removeClass('active text-white').addClass('text-slate-400');
            $(`#${tabId}`).addClass('active');
            $(`[data-tab="${tabId}"]`).addClass('active text-white').removeClass('text-slate-400');

            // Trigger renders
            if (tabId === 'tab-library') this.renderLibrary();
            if (tabId === 'tab-custom') this.renderCustomRoutines();
            if (tabId === 'tab-stats') this.renderStats();
        });

        $('#lib-search').on('input', () => this.renderLibrary());
        $('#create-routine-btn').click(() => this.createNewRoutine());

        $('#open-profile').click(() => {
            const el = $('#journal-list').empty();
            if (this.db.history.length === 0) el.html('<div class="text-center text-slate-500 text-xs py-10">No history yet.</div>');
            else this.db.history.forEach(h => el.append(`<div class="glass-panel p-4 rounded-2xl flex justify-between items-center mb-2"><div><div class="text-[10px] text-slate-500">${h.date}</div><div class="font-bold text-white text-sm">${h.focus}</div></div><div class="text-xs font-mono text-slate-300">${h.time}</div></div>`));

            this.renderAchievements();
            $('#profile-modal').removeClass('hidden');
        });

        $('#close-profile').click(() => $('#profile-modal').addClass('hidden'));

        // Profile Actions
        $('.theme-btn').click((e) => { const t = $(e.currentTarget).data('theme'); this.applyTheme(t); });
        $('#quick-mute').click(() => {
            this.db.profile.sound = (this.db.profile.sound === 'silent') ? 'voice' : 'silent';
            this.db.save('PROF', this.db.profile);
            this.updateAudioIcon();
            this.showToast(this.db.profile.sound === 'silent' ? "Muted" : "Voice On");
        });
        $('#level-up-btn').click(() => { this.db.profile.level += 0.1; this.db.save('PROF', this.db.profile); this.updateSettingsUI(); this.loadDay(this.state.activeDay); });
        $('#level-reset-btn').click(() => { this.db.profile.level = 1.0; this.db.save('PROF', this.db.profile); this.updateSettingsUI(); this.loadDay(this.state.activeDay); });

        $('#export-data').click(() => this.db.exportData());
        $('#import-data').change((e) => this.db.importData(e.target.files[0], (success, msg) => {
            this.showToast(msg);
            if (success) location.reload();
        }));
        $('#hard-reset').click(() => { if (confirm("Factory Reset?")) this.db.clear(); });

        // Warmup Toggle
        $('#warmup-toggle').change((e) => {
            this.db.profile.warmup = e.target.checked;
            this.db.save('PROF', this.db.profile);
            this.loadDay(this.state.activeDay);
        });

        // Overload Modal
        $('#overload-yes').click(() => {
            this.db.schedule[this.state.activeDay].exercises.forEach(e => {
                e.target = Math.ceil((e.target || 10) * 1.1); // Increase target by 10%
            });
            this.db.save('SCHED', this.db.schedule);
            $('#overload-modal').addClass('hidden');
            this.showToast("Targets Increased!");
            this.loadDay(this.state.activeDay);
        });
        $('#overload-no').click(() => $('#overload-modal').addClass('hidden'));

        // Reset Day
        $('#reset-day-btn').click(() => {
            if (confirm("Clear day?")) {
                delete this.db.completed[this.state.activeDay];
                this.db.save('COMP', this.db.completed);
                this.loadDay(this.state.activeDay);
            }
        });

        // Rep Input Submit
        $('#rep-input-submit').click(() => this.submitRepInput());
    }

    // --- HELPERS ---
    checkStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (this.db.streak.last !== today && this.db.streak.last !== yesterday.toDateString()) {
            if (this.db.streak.last) { this.db.streak.count = 0; }
        }
        $('#streak-count').text(this.db.streak.count);
        if (this.db.streak.count > 0) $('#streak-icon').removeClass('text-slate-600').addClass('text-orange-500 streak-fire');
        else $('#streak-icon').addClass('text-slate-600').removeClass('text-orange-500 streak-fire');
    }

    updateStreak(increment = false) {
        const today = new Date().toDateString();
        if (increment && this.db.streak.last !== today) {
            this.db.streak.count++;
            this.db.streak.last = today;
            this.db.save('STREAK', this.db.streak);
        }
        this.checkStreak();
    }

    applyTheme(t) {
        $('body').removeClass().addClass(t);
        this.db.profile.theme = t;
        this.db.save('PROF', this.db.profile);
    }

    updateSettingsUI() { $('#modal-level-val').text(this.db.profile.level.toFixed(1) + "x"); }

    updateAudioIcon() {
        if (this.db.profile.sound === 'silent') $('#quick-mute').html('<i class="fas fa-volume-mute text-red-400"></i>');
        else $('#quick-mute').html('<i class="fas fa-volume-up text-xs"></i>');
    }

    showToast(msg) {
        const t = $(`<div class="toast">${msg}</div>`);
        $('#toast-container').append(t);
        setTimeout(() => { t.fadeOut(300, () => t.remove()); }, 2000);
    }

    speak(text) {
        if (this.db.profile.sound === 'silent') return;
        this.synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.1;
        this.synth.speak(u);
    }

    playSound(type) {
        if (this.db.profile.sound === 'silent') return;
        if (type === 'beep') {
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.connect(g); g.connect(this.audioCtx.destination);
            o.type = 'triangle'; o.frequency.value = 600;
            o.start(); g.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.15);
            o.stop(this.audioCtx.currentTime + 0.15);
        }
    }

    // --- CUSTOM ROUTINES & LIBRARY ---
    renderLibrary() {
        const query = $('#lib-search').val().toLowerCase();
        const container = $('#library-list').empty();

        this.db.LIBRARY.forEach(ex => {
            if (ex.name.toLowerCase().includes(query) || ex.muscles.some(m => m.toLowerCase().includes(query))) {
                container.append(`
                    <div class="lib-item">
                        <div class="flex items-center space-x-3">
                            <i class="fas ${ex.icon} text-slate-400"></i>
                            <div>
                                <div class="text-sm font-bold text-white">${ex.name}</div>
                                <div class="text-[10px] text-slate-500 uppercase">${ex.muscles.join(', ')}</div>
                            </div>
                        </div>
                        <button class="add-lib-btn w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-green-500" data-id="${ex.id}">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                `);
            }
        });

        $('.add-lib-btn').off().click((e) => {
            const id = $(e.currentTarget).data('id');
            this.addExerciseFromLib(id);
        });
    }

    renderCustomRoutines() {
        const container = $('#custom-routines-list').empty();
        const routines = this.db.customRoutines;

        if (Object.keys(routines).length === 0) {
            container.html('<div class="text-center text-slate-500 text-xs py-4">No custom routines yet.<br>Build a workout then click "+ New Routine".</div>');
            return;
        }

        Object.values(routines).forEach(rut => {
            container.append(`
                <div class="routine-card mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-white">${rut.name}</h3>
                        <div class="space-x-2">
                            <button class="load-rut-btn text-xs bg-blue-600 px-3 py-1 rounded-lg text-white font-bold uppercase" data-id="${rut.id}">Load</button>
                            <button class="del-rut-btn text-xs text-red-400 px-2" data-id="${rut.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="text-[10px] text-slate-400">${rut.exercises.length} exercises • ${rut.muscles.join(', ')}</div>
                </div>
            `);
        });

        $('.load-rut-btn').click((e) => {
            if (confirm("Load this routine? It will replace today's current exercises.")) {
                const id = $(e.currentTarget).data('id');
                this.loadRoutine(id);
            }
        });

        $('.del-rut-btn').click((e) => {
            if (confirm("Delete this routine?")) {
                const id = $(e.currentTarget).data('id');
                this.db.deleteRoutine(id);
                this.renderCustomRoutines();
            }
        });
    }

    addExerciseFromLib(libId) {
        const libEx = this.db.LIBRARY.find(e => e.id === libId);
        if (!libEx) return;

        // Create a unique instance ID based on timestamp
        const newEx = {
            id: 'cust_' + Date.now(),
            name: libEx.name,
            time: libEx.time || 30,
            target: libEx.target || 15,
            icon: libEx.icon,
            rest: 30
        };

        this.db.schedule[this.state.activeDay].exercises.push(newEx);
        this.db.save('SCHED', this.db.schedule);
        this.buildQueue(); // Refresh queue
        this.renderList();
        this.showToast("Added " + libEx.name);
    }

    createNewRoutine() {
        const name = prompt("Name your routine (e.g., 'Core Blaster'):");
        if (!name) return;

        const currentExercises = this.db.schedule[this.state.activeDay].exercises;
        const currentMuscles = this.db.schedule[this.state.activeDay].muscles;

        this.db.saveRoutine(name, currentExercises, "#6366f1", currentMuscles);
        this.renderCustomRoutines();
        this.showToast("Routine Saved!");
    }

    loadRoutine(id) {
        const rut = this.db.customRoutines[id];
        if (!rut) return;

        this.db.schedule[this.state.activeDay].exercises = [...rut.exercises];
        this.db.schedule[this.state.activeDay].focus = rut.name;
        // Keep original day color or update? Let's keep original for now to parse 'day' logic, 
        // but maybe we update content.
        this.db.save('SCHED', this.db.schedule);

        // Refresh UI
        $('#day-focus').text(rut.name);
        this.buildQueue();
        this.renderList();
        this.showToast("Routine Loaded");
        $('#profile-modal').addClass('hidden'); // Close modal
    }

    // --- ANALYTICS & GAMIFICATION ---
    renderStats() {
        // Simple Stats
        $('#stat-total-workouts').text(this.db.history.length);
        let totalMin = 0;
        this.db.history.forEach(h => {
            const parts = h.time.split(':');
            totalMin += parseInt(parts[0]) + (parseInt(parts[1]) / 60);
        });
        $('#stat-total-time').text(Math.round(totalMin) + "m");

        // Weekly Chart
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay()); startOfWeek.setHours(0, 0, 0, 0);

        const counts = [0, 0, 0, 0, 0, 0, 0];

        this.db.history.forEach(h => {
            const d = new Date(h.date);
            if (d >= startOfWeek) {
                counts[d.getDay()]++;
            }
        });

        const max = Math.max(...counts, 3); // Scale
        const chartEl = $('#weekly-chart').empty();
        const labelsEl = $('#weekly-labels').empty();

        counts.forEach((c, i) => {
            const h = (c / max) * 100;
            const isToday = (i === today.getDay()) ? 'current' : '';
            chartEl.append(`<div class="chart-bar-container"><div class="chart-bar ${isToday}" style="height: ${h}%"></div></div>`);
            labelsEl.append(`<div>${days[i]}</div>`);
        });
    }

    renderAchievements() {
        const container = $('#achievements-list').empty();
        this.db.ACHIEVEMENTS.forEach(ach => {
            const unlocked = this.db.achievements.includes(ach.id);
            const cls = unlocked ? 'unlocked' : '';
            const iconColor = unlocked ? 'text-white' : 'text-slate-600';

            container.append(`
                <div class="badge-item ${cls}" title="${ach.name}: ${ach.desc}">
                    <i class="fas ${ach.icon} ${iconColor}"></i>
                </div>
            `);
        });
    }

    checkAchievements() {
        const now = new Date();
        const hr = now.getHours();
        const day = now.getDay();
        const newlyUnlocked = [];

        const tryUnlock = (id) => {
            if (this.db.unlockAchievement(id)) newlyUnlocked.push(id);
        };

        tryUnlock('first');
        if (hr < 8) tryUnlock('early');
        if (hr >= 20) tryUnlock('night');
        if (day === 0 || day === 6) tryUnlock('weekend');
        if (this.db.streak.count >= 3) tryUnlock('streak3');
        if (this.db.profile.level >= 1.5) tryUnlock('iron');

        if (newlyUnlocked.length > 0) {
            this.playSound('beep');
            this.showToast("Achievement Unlocked!");
            this.fireConfetti();
        }
    }

    fireConfetti() {
        const c = document.getElementById('confetti-canvas');
        if (!c) return; // Safety check
        const x = c.getContext('2d');
        c.width = window.innerWidth; c.height = window.innerHeight;
        let p = []; for (let i = 0; i < 100; i++)p.push({ x: c.width / 2, y: c.height / 2, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, c: `hsl(${Math.random() * 360},100%,50%)`, a: 1 });
        function a() { x.clearRect(0, 0, c.width, c.height); p.forEach((k, i) => { k.x += k.vx; k.y += k.vy; k.vy += 0.5; k.a -= 0.02; x.fillStyle = k.c; x.globalAlpha = k.a; x.fillRect(k.x, k.y, 8, 8); if (k.a <= 0) p.splice(i, 1) }); if (p.length) requestAnimationFrame(a); } a();
    }

    // --- PWA & SHARING ---
    shareSession() {
        const summary = `I just crushed the "${this.db.schedule[this.state.activeDay].focus}" workout on DailyBurn! 💪 Time: ${$('#global-timer').text()} | Level: ${this.db.profile.level.toFixed(1)}x`;
        if (navigator.share) {
            navigator.share({ title: 'DailyBurn Workout', text: summary }).catch(console.error);
        } else {
            navigator.clipboard.writeText(summary);
            this.showToast("Copied to Clipboard!");
        }
    }

    // --- REP INPUT ---
    showRepInput(exId, target, btn) {
        this.state.currentRepInputExId = exId;
        this.state.currentRepInputBtn = btn;
        $('#rep-input-target').text(target);
        $('#rep-input-value').val('').attr('placeholder', target);
        $('#rep-input-modal').removeClass('hidden');
        $('#rep-input-value').focus();
    }

    submitRepInput() {
        const exId = this.state.currentRepInputExId;
        const btn = this.state.currentRepInputBtn;
        const inputVal = parseInt($('#rep-input-value').val()) || 0;
        const target = parseInt($('#rep-input-target').text()) || 10;

        $('#rep-input-modal').addClass('hidden');

        // Progressive overload: If user beat target, increase it
        const ex = this.db.schedule[this.state.activeDay].exercises.find(e => e.id === exId);
        if (ex && inputVal >= target) {
            ex.target = Math.ceil(ex.target * 1.1); // Increase by 10%
            this.db.save('SCHED', this.db.schedule);
            this.showToast("🔥 Target Increased!");
        } else if (inputVal > 0) {
            this.showToast(`Logged: ${inputVal} reps`);
        }

        this.completeExercise(exId, null);

        // Continue to next exercise in fullscreen
        this.state.fsExerciseIndex++;
        this.runFsExercise();
    }

    // --- FULLSCREEN WORKOUT ---
    startFullscreenWorkout() {
        console.log('Starting fullscreen workout, list length:', this.state.currentList.length);

        // Show fullscreen immediately
        const fsEl = $('#fullscreen-workout');
        fsEl.removeClass('hidden fs-rest-mode');

        // Ensure it's visible
        if (fsEl.hasClass('hidden')) {
            console.error('Fullscreen element still hidden after removeClass!');
        }

        this.state.fsExerciseIndex = 0;

        // Bind buttons FIRST before running exercise
        $('#fs-exit').off().click(() => this.exitFullscreen());
        $('#fs-skip').off().click(() => this.skipFsExercise());
        $('#fs-add-time').off().click(() => { this.state.fsTimeLeft += 15; });

        // Run first exercise
        this.runFsExercise();
    }

    runFsExercise() {
        const list = this.state.currentList;
        console.log('runFsExercise, index:', this.state.fsExerciseIndex, 'list length:', list.length);

        if (!list || list.length === 0) {
            console.warn('No exercises in list!');
            return; // Don't finish, just stay visible
        }

        if (this.state.fsExerciseIndex >= list.length) {
            this.finishFullscreen();
            return;
        }

        const ex = list[this.state.fsExerciseIndex];
        const time = Math.ceil((ex.time || 30) * this.db.profile.level);
        const target = Math.ceil((ex.target || 10) * this.db.profile.level);
        const isHold = ex.target === 1;

        // Update UI
        $('#fullscreen-workout').removeClass('fs-rest-mode');
        $('#fs-exercise-icon i').attr('class', `fas ${ex.icon}`);
        $('#fs-exercise-name').text(ex.name);
        $('#fs-exercise-target').text(isHold ? `Hold for ${time}s` : `Target: ${target} reps`);
        $('#fs-status').text('GO!').removeClass('text-emerald-400').addClass('text-white');

        // Update progress
        const pct = ((this.state.fsExerciseIndex) / list.length) * 100;
        $('#fs-progress-bar').css('width', pct + '%');

        this.speak(ex.name);
        this.state.fsTimeLeft = time;
        this.state.fsCurrentEx = ex;
        this.state.fsIsRest = false;

        clearInterval(this.state.fsIntv);
        this.state.fsIntv = setInterval(() => {
            this.state.fsTimeLeft--;
            $('#fs-countdown').text(this.state.fsTimeLeft);

            if (this.state.fsTimeLeft <= 3 && this.state.fsTimeLeft > 0) this.playSound('beep');

            if (this.state.fsTimeLeft <= 0) {
                clearInterval(this.state.fsIntv);

                if (isHold) {
                    this.completeExercise(ex.id, null);
                    this.state.fsExerciseIndex++;
                    this.runFsRest(ex.rest || 30);
                } else {
                    // Show rep input
                    this.showFsRepInput(ex.id, target);
                }
            }
        }, 1000);
    }

    showFsRepInput(exId, target) {
        this.state.currentRepInputExId = exId;
        this.state.currentRepInputBtn = null;
        $('#rep-input-target').text(target);
        $('#rep-input-value').val('').attr('placeholder', target);
        $('#rep-input-modal').removeClass('hidden');
        $('#rep-input-value').focus();
    }

    runFsRest(duration) {
        if (this.state.fsExerciseIndex >= this.state.currentList.length) {
            this.finishFullscreen();
            return;
        }

        const nextEx = this.state.currentList[this.state.fsExerciseIndex];

        $('#fullscreen-workout').addClass('fs-rest-mode');
        $('#fs-exercise-name').text('REST');
        $('#fs-exercise-target').text(`Up next: ${nextEx.name}`);
        $('#fs-status').text('RECOVER').addClass('text-emerald-400').removeClass('text-white');

        this.state.fsTimeLeft = duration;
        this.state.fsIsRest = true;

        clearInterval(this.state.fsIntv);
        this.state.fsIntv = setInterval(() => {
            this.state.fsTimeLeft--;
            $('#fs-countdown').text(this.state.fsTimeLeft);

            if (this.state.fsTimeLeft <= 0) {
                clearInterval(this.state.fsIntv);
                this.runFsExercise();
            }
        }, 1000);
    }

    skipFsExercise() {
        clearInterval(this.state.fsIntv);
        if (this.state.fsIsRest) {
            this.runFsExercise();
        } else {
            const ex = this.state.fsCurrentEx;
            if (ex) this.completeExercise(ex.id, null);
            this.state.fsExerciseIndex++;
            this.runFsRest(ex?.rest || 30);
        }
    }

    exitFullscreen() {
        clearInterval(this.state.fsIntv);
        $('#fullscreen-workout').addClass('hidden');
    }

    finishFullscreen() {
        clearInterval(this.state.fsIntv);
        $('#fullscreen-workout').addClass('hidden');
        this.finishSession();
    }
}
