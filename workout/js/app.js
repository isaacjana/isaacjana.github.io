/**
 * DailyBurn - Premium Fitness App
 * Core Logic & UI Controller
 */

// ===============================================
// Toast Notification System
// ===============================================
class ToastManager {
    static container = null;

    static init() {
        this.container = document.getElementById('toast-container');
    }

    static show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="text-lg">${icons[type]}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static success(message) { this.show(message, 'success'); }
    static error(message) { this.show(message, 'error', 4000); }
    static info(message) { this.show(message, 'info'); }
    static warning(message) { this.show(message, 'warning'); }
}

// ===============================================
// Data Manager - Handles all data operations
// ===============================================
class DataManager {
    static STORAGE_KEY = 'db_user_data';

    static getDefaultData() {
        return {
            name: '',
            weight: 0,
            height: 0,
            bmi: 0,
            intensity: 'moderate',
            history: 0,
            logs: [],
            streak: 0,
            lastWorkoutDate: null,
            achievements: [],
            createdAt: new Date().toISOString()
        };
    }

    static getUserData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                return { ...this.getDefaultData(), ...data };
            }
        } catch (e) {
            console.error('Error reading user data:', e);
        }
        return this.getDefaultData();
    }

    static saveUserData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving user data:', e);
            ToastManager.error('Failed to save data');
            return false;
        }
    }

    static addLog(data, log) {
        if (!data.logs) data.logs = [];

        // Update streak
        const today = new Date().toDateString();
        const lastWorkout = data.lastWorkoutDate ? new Date(data.lastWorkoutDate).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastWorkout === yesterday) {
            data.streak = (data.streak || 0) + 1;
        } else if (lastWorkout !== today) {
            data.streak = 1;
        }

        data.lastWorkoutDate = new Date().toISOString();
        data.logs.push(log);
        data.history = data.logs.length;

        // Check for achievements
        this.checkAchievements(data);

        this.saveUserData(data);
        return data.streak;
    }

    static checkAchievements(data) {
        const achievements = data.achievements || [];
        const newAchievements = [];

        // First workout
        if (data.logs.length === 1 && !achievements.includes('first_workout')) {
            achievements.push('first_workout');
            newAchievements.push({ id: 'first_workout', title: 'First Steps', icon: '🎯' });
        }

        // 7-day streak
        if (data.streak >= 7 && !achievements.includes('week_streak')) {
            achievements.push('week_streak');
            newAchievements.push({ id: 'week_streak', title: 'Week Warrior', icon: '🔥' });
        }

        // 10 workouts
        if (data.logs.length >= 10 && !achievements.includes('ten_workouts')) {
            achievements.push('ten_workouts');
            newAchievements.push({ id: 'ten_workouts', title: 'Dedicated', icon: '💪' });
        }

        // 30-day streak
        if (data.streak >= 30 && !achievements.includes('month_streak')) {
            achievements.push('month_streak');
            newAchievements.push({ id: 'month_streak', title: 'Unstoppable', icon: '🏆' });
        }

        // 1000 calories burned total
        const totalCalories = data.logs.reduce((sum, log) => sum + (log.calories || 0), 0);
        if (totalCalories >= 1000 && !achievements.includes('calorie_king')) {
            achievements.push('calorie_king');
            newAchievements.push({ id: 'calorie_king', title: 'Calorie Crusher', icon: '⚡' });
        }

        data.achievements = achievements;
        return newAchievements;
    }

    static getWeeklyStats(logs) {
        const stats = new Array(7).fill(0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        logs.forEach(log => {
            const logDate = new Date(log.date);
            logDate.setHours(0, 0, 0, 0);
            const diffTime = now - logDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                stats[6 - diffDays] += 1;
            }
        });
        return stats;
    }

    static getTotalStats(logs) {
        let totalCalories = 0;
        let totalMinutes = 0;

        logs.forEach(log => {
            totalCalories += log.calories || 0;
            totalMinutes += Math.floor((log.duration || 0) / 60);
        });

        return { totalCalories: Math.round(totalCalories), totalMinutes };
    }

    static getHistoryStats(logs) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let weekCount = 0;
        let monthCount = 0;

        logs.forEach(log => {
            const logDate = new Date(log.date);
            if (logDate >= startOfWeek) weekCount++;
            if (logDate >= startOfMonth) monthCount++;
        });

        return { weekCount, monthCount };
    }

    static calculateBMI(w, h) {
        const heightInMeters = h / 100;
        return (w / (heightInMeters * heightInMeters)).toFixed(1);
    }

    static getIntensity(bmi) {
        if (bmi > 28 || bmi < 18.5) return 'low';
        if (bmi >= 18.5 && bmi <= 24.9) return 'moderate';
        if (bmi >= 25 && bmi <= 27.9) return 'high';
        return 'moderate';
    }

    static getMET(intensity, phase) {
        const p = phase.toLowerCase();
        if (p.includes('warmup') || p.includes('cool') || p.includes('preparation')) return 2.5;
        if (intensity === 'low') return 3.5;
        if (intensity === 'moderate') return 5.5;
        if (intensity === 'high') return 8.0;
        return 5.0;
    }

    static exportData() {
        const data = this.getUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dailyburn-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ToastManager.success('Data exported successfully!');
    }

    static async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate imported data
            if (!data.name && !data.logs) {
                throw new Error('Invalid backup file');
            }

            // Merge with defaults
            const mergedData = { ...this.getDefaultData(), ...data };
            this.saveUserData(mergedData);
            ToastManager.success('Data imported successfully!');
            return mergedData;
        } catch (e) {
            console.error('Import error:', e);
            ToastManager.error('Failed to import data. Invalid file format.');
            return null;
        }
    }
}

// ===============================================
// Speech Manager - Voice Guidance
// ===============================================
class SpeechManager {
    constructor() {
        this.speech = window.speechSynthesis;
        this.enabled = true;
        this.voice = null;
        this.loadVoice();
    }

    loadVoice() {
        // Try to get a better voice
        const loadVoices = () => {
            const voices = this.speech?.getVoices() || [];
            // Prefer English voices
            this.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0];
        };

        if (this.speech) {
            loadVoices();
            this.speech.onvoiceschanged = loadVoices;
        }
    }

    speak(text) {
        if (!this.speech || !this.enabled) return;
        this.speech.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1;
        if (this.voice) utterance.voice = this.voice;
        this.speech.speak(utterance);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.speak("Voice guidance on.");
        } else {
            this.speech?.cancel();
        }
        return this.enabled;
    }
}

// ===============================================
// Audio Manager - Sound Effects
// ===============================================
class AudioManager {
    static context = null;

    static getContext() {
        if (!this.context) {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("AudioContext not supported:", e);
            }
        }
        return this.context;
    }

    static playTone(freq, duration, volume = 0.15) {
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio playback failed:", e);
        }
    }

    static beep() {
        this.playTone(880, 0.15);
    }

    static tick() {
        this.playTone(660, 0.08, 0.1);
    }

    static countdown() {
        this.playTone(440, 0.1, 0.12);
    }

    static complete() {
        // Success melody: C5 -> E5 -> G5
        this.playTone(523.25, 0.12);
        setTimeout(() => this.playTone(659.25, 0.12), 150);
        setTimeout(() => this.playTone(783.99, 0.25), 300);
    }

    static achievement() {
        // Special achievement sound
        this.playTone(523.25, 0.1);
        setTimeout(() => this.playTone(659.25, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 0.1), 200);
        setTimeout(() => this.playTone(1046.50, 0.3), 300);
    }
}

// ===============================================
// Main Application Class
// ===============================================
class WorkoutApp {
    constructor() {
        this.userData = DataManager.getUserData();
        this.speechManager = new SpeechManager();
        this.currentWorkout = [];
        this.currentIndex = 0;
        this.timerSeconds = 0;
        this.mainTimer = null;
        this.isPaused = false;
        this.totalTimeSpent = 0;
        this.totalCalories = 0;
        this.lastAchievements = [];

        this.init();
    }

    init() {
        ToastManager.init();
        this.bindEvents();

        if (this.userData.weight > 0) {
            this.initDashboard();
            this.switchScreen('screen-home');
        }

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('SW Registered'))
                .catch(err => console.log('SW Error', err));
        }
    }

    bindEvents() {
        // Profile Events
        $('#btn-save-profile').on('click', () => this.saveProfile());
        $('#btn-edit-profile').on('click', () => this.editProfile());

        // Workout Events
        $('#btn-start-workout').on('click', () => this.startWorkout());
        $('#btn-play-pause').on('click', () => this.togglePlayPause());
        $('#btn-skip').on('click', () => this.skipExercise());
        $('#btn-exit-workout').on('click', () => this.exitWorkout());
        $('#btn-add-time').on('click', () => this.addTime());

        // Voice Toggle
        $('#btn-voice-toggle').on('click', () => {
            const isEnabled = this.speechManager.toggle();
            $('#icon-voice-on, #icon-voice-off').toggleClass('hidden');
            ToastManager.info(isEnabled ? 'Voice guidance enabled' : 'Voice guidance disabled');
        });

        // Timeline Drawer
        $('#btn-timeline').on('click', () => this.openTimeline());
        $('#btn-close-timeline, #timeline-overlay').on('click', () => this.closeTimeline());

        // Summary & History
        $('#btn-finish').on('click', () => {
            this.initDashboard();
            this.switchScreen('screen-home');
        });
        $('#btn-view-history').on('click', () => this.viewHistory());
        $('#btn-history-back').on('click', () => this.switchScreen('screen-home'));
        $('#btn-share').on('click', () => this.shareResults());

        // Data Import/Export
        $('#btn-export-data').on('click', () => DataManager.exportData());
        $('#btn-import-data').on('click', () => $('#import-file-input').click());
        $('#import-file-input').on('change', (e) => this.handleImport(e));

        // Keyboard shortcuts
        $(document).on('keydown', (e) => this.handleKeyboard(e));
    }

    handleKeyboard(e) {
        if (!$('#screen-workout').hasClass('active')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                this.skipExercise();
                break;
            case 'Escape':
                this.exitWorkout();
                break;
        }
    }

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const data = await DataManager.importData(file);
        if (data) {
            this.userData = data;
            this.initDashboard();
        }

        // Reset file input
        e.target.value = '';
    }

    switchScreen(id) {
        $('.screen').removeClass('active');
        $(`#${id}`).addClass('active');
    }

    // ========== Profile Management ==========
    saveProfile() {
        const name = $('#input-name').val().trim();
        const weight = parseFloat($('#input-weight').val());
        const height = parseFloat($('#input-height').val());

        // Validation
        if (!weight || weight < 30 || weight > 300) {
            ToastManager.error('Please enter a valid weight (30-300 kg)');
            $('#input-weight').focus();
            return;
        }

        if (!height || height < 100 || height > 250) {
            ToastManager.error('Please enter a valid height (100-250 cm)');
            $('#input-height').focus();
            return;
        }

        this.userData.name = name || 'Friend';
        this.userData.weight = weight;
        this.userData.height = height;
        this.userData.bmi = DataManager.calculateBMI(weight, height);
        this.userData.intensity = DataManager.getIntensity(this.userData.bmi);

        DataManager.saveUserData(this.userData);
        ToastManager.success('Profile saved successfully!');
        this.initDashboard();
        this.switchScreen('screen-home');
    }

    editProfile() {
        $('#input-name').val(this.userData.name);
        $('#input-weight').val(this.userData.weight);
        $('#input-height').val(this.userData.height);
        this.switchScreen('screen-profile');
    }

    // ========== Dashboard ==========
    initDashboard() {
        $('#user-name-label').text(this.userData.name || 'there');

        const labels = {
            low: 'Low Intensity • Gentle',
            moderate: 'Moderate Intensity • Balanced',
            high: 'High Intensity • Challenging'
        };
        $('#user-intensity-label').text(labels[this.userData.intensity]);
        $('#stat-count').text(this.userData.history || 0);

        // Total stats
        const { totalCalories, totalMinutes } = DataManager.getTotalStats(this.userData.logs || []);
        $('#stat-total-calories').text(totalCalories.toLocaleString());
        $('#stat-total-minutes').text(totalMinutes);

        // Streak display
        const streak = this.userData.streak || 0;
        if (streak > 0) {
            $('#streak-badge').removeClass('hidden').addClass('flex');
            $('#streak-count').text(streak);
        } else {
            $('#streak-badge').addClass('hidden');
        }

        // Estimated calories & exercises
        const factor = this.userData.intensity === 'low' ? 4 : (this.userData.intensity === 'moderate' ? 6 : 8);
        const est = Math.round(factor * this.userData.weight * (25 / 60));
        $('#est-calories').text(est + " kcal");

        // Count exercises
        const db = exercisesDB[this.userData.intensity];
        const exerciseCount = 1 + db.warmup.length + (db.main.length * 2) + (db.main.length * 2 - 1) + db.cool.length;
        $('#est-exercises').text(exerciseCount);

        this.renderWeeklyChart();
    }

    renderWeeklyChart() {
        const stats = DataManager.getWeeklyStats(this.userData.logs || []);
        const max = Math.max(...stats, 1);
        const container = $('#weekly-bars');
        container.empty();

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayIdx = new Date().getDay();

        // Create bars for 7 days (starting from 6 days ago to today)
        for (let i = 0; i < 7; i++) {
            const dayOffset = 6 - i;
            const date = new Date();
            date.setDate(date.getDate() - dayOffset);
            const dayName = days[date.getDay()];
            const count = stats[i];
            const height = (count / max) * 100;
            const isToday = dayOffset === 0;

            const bar = $(`
                <div class="flex-1 flex flex-col items-center gap-2">
                    <div class="w-full bg-white/5 rounded-lg relative flex items-end justify-center" style="height: 100px">
                        <div class="weekly-bar w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg transition-all duration-1000 ${isToday ? 'today' : 'opacity-50'}" 
                             style="height: 0%"></div>
                        ${count > 0 ? `<span class="absolute top-2 text-[10px] font-bold text-emerald-400">${count}</span>` : ''}
                    </div>
                    <span class="text-[10px] ${isToday ? 'text-emerald-400 font-black' : 'text-gray-500 font-bold'}">${dayName}</span>
                </div>
            `);
            container.append(bar);
            setTimeout(() => bar.find('.weekly-bar').css('height', `${Math.max(height, count > 0 ? 15 : 5)}%`), 100 + i * 50);
        }
    }

    // ========== Workout Session ==========
    buildWorkout() {
        const db = exercisesDB[this.userData.intensity];
        let workout = [];

        // Preparation
        workout.push({
            name: "Get Ready",
            tip: "Find your space and prepare to move.",
            duration: 10,
            phase: "Preparation",
            type: "Rest"
        });

        // Warmup Phase
        db.warmup.forEach(ex => workout.push({ ...ex, phase: 'Warmup', type: 'Work' }));

        // Main Circuit - 2 Rounds
        for (let round = 1; round <= 2; round++) {
            db.main.forEach((ex, idx) => {
                workout.push({
                    ...ex,
                    name: round > 1 ? `${ex.name} (R2)` : ex.name,
                    phase: `Main Circuit - Round ${round}`,
                    type: 'Work'
                });

                // Add rest between exercises (except after last exercise of last round)
                if (!(round === 2 && idx === db.main.length - 1)) {
                    workout.push({
                        name: 'Rest',
                        tip: 'Catch your breath and stay hydrated.',
                        duration: 15,
                        phase: 'Main Circuit',
                        type: 'Rest'
                    });
                }
            });
        }

        // Cool Down Phase
        db.cool.forEach(ex => workout.push({ ...ex, phase: 'Cool Down', type: 'Work' }));

        return workout;
    }

    startWorkout() {
        this.currentWorkout = this.buildWorkout();
        this.currentIndex = 0;
        this.totalTimeSpent = 0;
        this.totalCalories = 0;
        this.isPaused = false;
        this.lastAchievements = [];

        this.renderTimeline();
        this.switchScreen('screen-workout');
        this.loadExercise(0);

        // Make sure play button shows pause icon
        $('#icon-play').addClass('hidden');
        $('#icon-pause').removeClass('hidden');
    }

    renderTimeline() {
        const container = $('#timeline-content');
        container.empty();

        let currentPhase = '';
        this.currentWorkout.forEach((ex, idx) => {
            // Skip minor rest periods in timeline display
            if (ex.type === 'Rest' && ex.name === 'Rest') return;

            // Add phase header if changed
            if (ex.phase !== currentPhase) {
                currentPhase = ex.phase;
                container.append(`
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-4 mb-2">${currentPhase}</div>
                `);
            }

            const item = $(`
                <div class="timeline-item py-2" id="tl-item-${idx}">
                    <p class="font-semibold text-white">${ex.name}</p>
                    <p class="text-[11px] text-emerald-500">${ex.duration}s • ${ex.category || 'Prep'}</p>
                </div>
            `);
            container.append(item);
        });
    }

    openTimeline() {
        $('#timeline-drawer').addClass('open');
        $('#timeline-overlay').addClass('active');
    }

    closeTimeline() {
        $('#timeline-drawer').removeClass('open');
        $('#timeline-overlay').removeClass('active');
    }

    loadExercise(index) {
        if (index >= this.currentWorkout.length) {
            this.finishWorkout();
            return;
        }

        const ex = this.currentWorkout[index];
        this.currentIndex = index;
        this.timerSeconds = ex.duration;

        // Update UI
        $('#current-phase-label').text(ex.phase);
        $('#current-exercise-name').text(ex.name);
        $('#exercise-tip').text(`"${ex.tip}"`);
        $('#exercise-type-label').text(ex.type);

        // Progress indicators
        $('#progress-current').text(index + 1);
        $('#progress-total').text(`/ ${this.currentWorkout.length}`);

        // Next exercise preview
        const nextEx = this.currentWorkout[index + 1];
        $('#next-exercise-name').text(nextEx ? nextEx.name : "Finishing Up! 🎉");

        // Update Timeline visual
        $('.timeline-item').removeClass('active completed');
        for (let i = 0; i < index; i++) {
            $(`#tl-item-${i}`).addClass('completed');
        }
        $(`#tl-item-${index}`).addClass('active');

        // Screen mode based on exercise type
        if (ex.type === 'Rest') {
            $('#screen-workout').removeClass('work-mode').addClass('pulse-rest');
            $('#timer-progress').removeClass('text-emerald-400').addClass('text-blue-400');
            $('#exercise-type-label').removeClass('text-emerald-500').addClass('text-blue-500');
        } else {
            $('#screen-workout').removeClass('pulse-rest').addClass('work-mode');
            $('#timer-progress').removeClass('text-blue-400').addClass('text-emerald-400');
            $('#exercise-type-label').removeClass('text-blue-500').addClass('text-emerald-500');
        }

        this.updateTimerUI();
        this.startTimer();

        // Voice announcement
        if (ex.name === 'Rest') {
            this.speechManager.speak('Rest time. Breathe deeply.');
        } else if (ex.name === 'Get Ready') {
            this.speechManager.speak('Get ready! Your workout begins now.');
        } else {
            this.speechManager.speak(`${ex.name}. ${ex.tip}`);
        }
    }

    startTimer() {
        clearInterval(this.mainTimer);
        this.mainTimer = setInterval(() => {
            if (!this.isPaused) {
                this.timerSeconds--;
                this.totalTimeSpent++;

                // Countdown beeps
                if (this.timerSeconds > 0 && this.timerSeconds <= 3) {
                    AudioManager.countdown();
                    this.speechManager.speak(this.timerSeconds.toString());
                }

                // Calorie calculation
                const ex = this.currentWorkout[this.currentIndex];
                const met = DataManager.getMET(this.userData.intensity, ex.phase);
                this.totalCalories += (met * this.userData.weight * (1 / 3600));

                this.updateTimerUI();

                // Simulate heart rate
                const baseHR = this.userData.intensity === 'high' ? 145 : (this.userData.intensity === 'moderate' ? 125 : 105);
                const variation = ex.type === 'Rest' ? -10 : 0;
                const mockHR = baseHR + variation + Math.floor(Math.random() * 15);
                $('#mock-hr').text(`${mockHR} BPM`);

                // Time's up
                if (this.timerSeconds <= 0) {
                    clearInterval(this.mainTimer);
                    AudioManager.beep();
                    this.loadExercise(this.currentIndex + 1);
                }
            }
        }, 1000);
    }

    updateTimerUI() {
        const ex = this.currentWorkout[this.currentIndex];
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        $('#timer-display').text(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

        // Circle progress
        const percent = this.timerSeconds / ex.duration;
        const offset = 753.98 * (1 - percent);
        $('#timer-progress').css('stroke-dashoffset', offset);

        // Global progress
        const globalPercent = ((this.currentIndex + (1 - percent)) / this.currentWorkout.length) * 100;
        $('#global-progress').css('width', `${globalPercent}%`);
    }

    togglePlayPause() {
        this.isPaused = !this.isPaused;
        $('#icon-play, #icon-pause').toggleClass('hidden');

        if (this.isPaused) {
            this.speechManager.speak('Paused.');
        } else {
            this.speechManager.speak('Let\'s go!');
        }
    }

    skipExercise() {
        clearInterval(this.mainTimer);
        AudioManager.tick();
        this.loadExercise(this.currentIndex + 1);
    }

    addTime() {
        this.timerSeconds += 10;
        ToastManager.info('+10 seconds added');
        this.updateTimerUI();
    }

    exitWorkout() {
        if (confirm("Exit workout? Your progress will be lost.")) {
            clearInterval(this.mainTimer);
            this.switchScreen('screen-home');
        }
    }

    finishWorkout() {
        clearInterval(this.mainTimer);
        AudioManager.complete();

        // Log the workout
        const newLog = {
            date: new Date().toISOString(),
            duration: this.totalTimeSpent,
            calories: Math.round(this.totalCalories),
            intensity: this.userData.intensity
        };

        const previousAchievements = [...(this.userData.achievements || [])];
        DataManager.addLog(this.userData, newLog);

        // Check for new achievements
        const newAchievements = (this.userData.achievements || []).filter(a => !previousAchievements.includes(a));
        this.lastAchievements = newAchievements;

        // Update UI
        $('#stat-count').text(this.userData.history);

        const mins = Math.floor(this.totalTimeSpent / 60);
        const secs = this.totalTimeSpent % 60;
        $('#summary-time').text(`${mins}:${secs.toString().padStart(2, '0')}`);
        $('#summary-calories').text(Math.round(this.totalCalories));

        this.renderMuscleBreakdown();
        this.renderAchievements();
        this.switchScreen('screen-summary');
        this.triggerConfetti();

        // Voice congratulations
        this.speechManager.speak('Workout complete! Great job today!');
    }

    renderMuscleBreakdown() {
        const stats = { Upper: 0, Lower: 0, Core: 0, Cardio: 0 };
        this.currentWorkout.forEach(ex => {
            if (ex.type === 'Work' && ex.category) {
                stats[ex.category] += ex.duration;
            }
        });

        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        const container = $('#muscle-breakdown');
        container.empty();

        const colors = {
            Upper: 'from-blue-500 to-blue-400',
            Lower: 'from-purple-500 to-purple-400',
            Core: 'from-emerald-500 to-emerald-400',
            Cardio: 'from-orange-500 to-orange-400'
        };

        Object.entries(stats).forEach(([muscle, count], idx) => {
            if (count === 0) return;
            const percent = Math.round((count / total) * 100);
            const row = $(`
                <div class="space-y-2 slide-up" style="animation-delay: ${idx * 100}ms">
                    <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                        <span class="text-gray-400">${muscle}</span>
                        <span class="text-emerald-400">${percent}%</span>
                    </div>
                    <div class="muscle-bar">
                        <div class="muscle-fill bg-gradient-to-r ${colors[muscle]}" style="width: 0%"></div>
                    </div>
                </div>
            `);
            container.append(row);
            setTimeout(() => row.find('.muscle-fill').css('width', `${percent}%`), 300 + idx * 100);
        });
    }

    renderAchievements() {
        const container = $('#achievement-container');
        container.empty();

        if (this.lastAchievements.length === 0) {
            container.addClass('hidden');
            return;
        }

        container.removeClass('hidden');
        AudioManager.achievement();

        // Find achievement details
        const achievementDetails = {
            'first_workout': { title: 'First Steps', icon: '🎯', desc: 'Completed your first workout!' },
            'week_streak': { title: 'Week Warrior', icon: '🔥', desc: '7-day streak achieved!' },
            'ten_workouts': { title: 'Dedicated', icon: '💪', desc: '10 workouts completed!' },
            'month_streak': { title: 'Unstoppable', icon: '🏆', desc: '30-day streak achieved!' },
            'calorie_king': { title: 'Calorie Crusher', icon: '⚡', desc: '1000+ calories burned!' }
        };

        this.lastAchievements.forEach(id => {
            const achievement = achievementDetails[id];
            if (achievement) {
                container.append(`
                    <div class="achievement-badge mb-4">
                        <span class="text-lg">${achievement.icon}</span>
                        <span>${achievement.title}</span>
                    </div>
                    <p class="text-gray-400 text-sm">${achievement.desc}</p>
                `);
            }
        });
    }

    triggerConfetti() {
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 40 * (timeLeft / duration);
            confetti({
                particleCount,
                spread: 70,
                origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 },
                colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
            });
            confetti({
                particleCount,
                spread: 70,
                origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 },
                colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
            });
        }, 200);
    }

    // ========== History ==========
    viewHistory() {
        const container = $('#history-list');
        container.empty();

        const logs = [...(this.userData.logs || [])].reverse();
        const { weekCount, monthCount } = DataManager.getHistoryStats(this.userData.logs || []);

        $('#history-week-count').text(`${weekCount} workout${weekCount !== 1 ? 's' : ''}`);
        $('#history-month-count').text(`${monthCount} workout${monthCount !== 1 ? 's' : ''}`);

        if (logs.length === 0) {
            container.append(`
                <div class="text-center py-16">
                    <div class="text-5xl mb-4">🏋️</div>
                    <p class="text-gray-500">No workouts logged yet.</p>
                    <p class="text-gray-600 text-sm mt-2">Complete your first workout to see it here!</p>
                </div>
            `);
        } else {
            logs.forEach((log, idx) => {
                const date = new Date(log.date);
                const formattedDate = date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                const formattedTime = date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const intensityColors = {
                    low: 'bg-blue-500/20 text-blue-400',
                    moderate: 'bg-emerald-500/20 text-emerald-400',
                    high: 'bg-orange-500/20 text-orange-400'
                };

                const card = $(`
                    <div class="glass p-4 rounded-2xl flex justify-between items-center slide-up" style="animation-delay: ${idx * 50}ms">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${intensityColors[log.intensity]}">${log.intensity}</span>
                            <p class="font-bold mt-2">${formattedDate}</p>
                            <p class="text-xs text-gray-500">${formattedTime}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xl font-black text-emerald-400">${log.calories} kcal</p>
                            <p class="text-xs text-gray-500">${Math.floor(log.duration / 60)}m ${log.duration % 60}s</p>
                        </div>
                    </div>
                `);
                container.append(card);
            });
        }

        this.switchScreen('screen-history');
    }

    shareResults() {
        const text = `🔥 I just crushed a ${Math.floor(this.totalTimeSpent / 60)}m workout on DailyBurn! Burned ${Math.round(this.totalCalories)} kcal. #Fitness #DailyBurn`;

        if (navigator.share) {
            navigator.share({
                title: 'Workout Complete!',
                text: text,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                ToastManager.success('Results copied to clipboard!');
            });
        }
    }
}

// ===============================================
// Initialize Application
// ===============================================
$(document).ready(() => {
    window.app = new WorkoutApp();
});
