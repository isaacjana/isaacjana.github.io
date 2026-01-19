/**
 * DailyBurn - Core Logic & UI Controller
 */

class DataManager {
    static getUserData() {
        const saved = localStorage.getItem('db_user_data');
        return saved ? JSON.parse(saved) : {
            name: '',
            weight: 0,
            height: 0,
            bmi: 0,
            intensity: 'moderate',
            history: 0
        };
    }

    static saveUserData(data) {
        localStorage.setItem('db_user_data', JSON.stringify(data));
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
        if (p.includes('warmup') || p.includes('cool')) return 2.5;
        if (intensity === 'low') return 3.5;
        if (intensity === 'moderate') return 5.5;
        if (intensity === 'high') return 8.0;
        return 5.0;
    }
}

class SpeechManager {
    constructor() {
        this.speech = window.speechSynthesis;
        this.enabled = true;
    }

    speak(text) {
        if (!this.speech || !this.enabled) return;
        this.speech.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1;
        this.speech.speak(utterance);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.speak("Voice guidance active.");
        else this.speech.cancel();
        return this.enabled;
    }
}

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

        this.init();
    }

    init() {
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
        $('#btn-save-profile').on('click', () => this.saveProfile());
        $('#btn-edit-profile').on('click', () => this.editProfile());
        $('#btn-start-workout').on('click', () => this.startWorkout());
        $('#btn-voice-toggle').on('click', () => {
            const isEnabled = this.speechManager.toggle();
            $('#icon-voice-on, #icon-voice-off').toggleClass('hidden');
        });
        $('#btn-timeline').on('click', () => $('#timeline-drawer').addClass('open'));
        $('#btn-close-timeline').on('click', () => $('#timeline-drawer').removeClass('open'));
        $('#btn-play-pause').on('click', () => this.togglePlayPause());
        $('#btn-skip').on('click', () => this.skipExercise());
        $('#btn-exit-workout').on('click', () => this.exitWorkout());
        $('#btn-finish').on('click', () => this.switchScreen('screen-home'));
    }

    switchScreen(id) {
        $('.screen').removeClass('active');
        $(`#${id}`).addClass('active');
    }

    saveProfile() {
        const name = $('#input-name').val();
        const weight = parseFloat($('#input-weight').val());
        const height = parseFloat($('#input-height').val());

        if (!weight || !height || weight < 30 || height < 100) {
            alert("Please enter realistic weight and height values.");
            return;
        }

        this.userData.name = name || 'Friend';
        this.userData.weight = weight;
        this.userData.height = height;
        this.userData.bmi = DataManager.calculateBMI(weight, height);
        this.userData.intensity = DataManager.getIntensity(this.userData.bmi);

        DataManager.saveUserData(this.userData);
        this.initDashboard();
        this.switchScreen('screen-home');
    }

    editProfile() {
        $('#input-name').val(this.userData.name);
        $('#input-weight').val(this.userData.weight);
        $('#input-height').val(this.userData.height);
        this.switchScreen('screen-profile');
    }

    initDashboard() {
        $('#user-name-label').text(this.userData.name || 'there');
        const labels = { low: 'Low Intensity', moderate: 'Moderate Intensity', high: 'Higher Intensity' };
        $('#user-intensity-label').text(labels[this.userData.intensity]);
        $('#stat-count').text(this.userData.history || 0);

        const factor = this.userData.intensity === 'low' ? 4 : (this.userData.intensity === 'moderate' ? 6 : 8);
        const est = Math.round(factor * this.userData.weight * (25 / 60));
        $('#est-calories').text(est + " kcal");
    }

    buildWorkout() {
        const db = exercisesDB[this.userData.intensity];
        let workout = [];

        workout.push({ name: "Get Ready", tip: "Find your space and prepare to move.", duration: 10, phase: "Preparation", type: "Rest" });

        db.warmup.forEach(ex => workout.push({ ...ex, phase: 'Warmup', type: 'Work' }));

        for (let round = 1; round <= 2; round++) {
            db.main.forEach((ex, idx) => {
                workout.push({ ...ex, name: `${ex.name}${round > 1 ? ' (R2)' : ''}`, phase: `Main Circuit - Round ${round}`, type: 'Work' });
                if (!(round === 2 && idx === db.main.length - 1)) {
                    workout.push({ name: 'Rest', tip: 'Catch your breath and hydrate.', duration: 15, phase: 'Main Circuit', type: 'Rest' });
                }
            });
        }

        db.cool.forEach(ex => workout.push({ ...ex, phase: 'Cool Down', type: 'Work' }));
        return workout;
    }

    startWorkout() {
        this.currentWorkout = this.buildWorkout();
        this.currentIndex = 0;
        this.totalTimeSpent = 0;
        this.totalCalories = 0;
        this.isPaused = false;

        this.renderTimeline();
        this.switchScreen('screen-workout');
        this.loadExercise(0);
    }

    renderTimeline() {
        const container = $('#timeline-content');
        container.empty();
        this.currentWorkout.forEach((ex, idx) => {
            if (ex.type === 'Rest' && ex.name === 'Rest') return; // Skip minor rests in timeline for clarity
            const item = $(`
                <div class="timeline-item" id="tl-item-${idx}">
                    <p class="text-xs text-gray-500 font-bold uppercase tracking-tighter">${ex.phase}</p>
                    <p class="font-bold text-white">${ex.name}</p>
                    <p class="text-[10px] text-emerald-500">${ex.duration}s • ${ex.category || 'N/A'}</p>
                </div>
            `);
            container.append(item);
        });
    }

    loadExercise(index) {
        if (index >= this.currentWorkout.length) {
            this.finishWorkout();
            return;
        }

        const ex = this.currentWorkout[index];
        this.currentIndex = index;
        this.timerSeconds = ex.duration;

        $('#current-phase-label').text(ex.phase);
        $('#current-exercise-name').text(ex.name);
        $('#exercise-tip').text(`"${ex.tip}"`);
        $('#exercise-type-label').text(ex.type);

        const nextEx = this.currentWorkout[index + 1];
        $('#next-exercise-name').text(nextEx ? nextEx.name : "Finishing Up!");

        // Update Timeline visual
        $('.timeline-item').removeClass('active');
        $(`#tl-item-${index}`).addClass('active');

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
        this.speechManager.speak(ex.name === 'Rest' ? 'Rest time.' : `Next exercise: ${ex.name}. ${ex.tip}`);
    }

    startTimer() {
        clearInterval(this.mainTimer);
        this.mainTimer = setInterval(() => {
            if (!this.isPaused) {
                this.timerSeconds--;
                this.totalTimeSpent++;

                if (this.timerSeconds > 0 && this.timerSeconds <= 3) {
                    this.speechManager.speak(this.timerSeconds.toString());
                }

                const ex = this.currentWorkout[this.currentIndex];
                const met = DataManager.getMET(this.userData.intensity, ex.phase);
                this.totalCalories += (met * this.userData.weight * (1 / 3600));

                this.updateTimerUI();

                // Mock Heart Rate
                const baseHR = this.userData.intensity === 'high' ? 140 : (this.userData.intensity === 'moderate' ? 120 : 100);
                const mockHR = baseHR + Math.floor(Math.random() * 20);
                $('#mock-hr').text(`${mockHR} BPM`);

                if (this.timerSeconds <= 0) {
                    clearInterval(this.mainTimer);
                    this.beep();
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

        const percent = this.timerSeconds / ex.duration;
        const offset = 753.98 * (1 - percent);
        $('#timer-progress').css('stroke-dashoffset', offset);

        const globalPercent = ((this.currentIndex + (1 - percent)) / this.currentWorkout.length) * 100;
        $('#global-progress').css('width', `${globalPercent}%`);
    }

    togglePlayPause() {
        this.isPaused = !this.isPaused;
        $('#icon-play, #icon-pause').toggleClass('hidden');
    }

    skipExercise() {
        clearInterval(this.mainTimer);
        this.loadExercise(this.currentIndex + 1);
    }

    exitWorkout() {
        if (confirm("Quit this workout? Progress will be lost.")) {
            clearInterval(this.mainTimer);
            this.switchScreen('screen-home');
        }
    }

    finishWorkout() {
        clearInterval(this.mainTimer);
        this.completeSound();

        this.userData.history = (this.userData.history || 0) + 1;
        DataManager.saveUserData(this.userData);
        $('#stat-count').text(this.userData.history);

        $('#summary-time').text(`${Math.floor(this.totalTimeSpent / 60)}:${(this.totalTimeSpent % 60).toString().padStart(2, '0')}`);
        $('#summary-calories').text(Math.round(this.totalCalories));

        this.renderMuscleBreakdown();
        this.switchScreen('screen-summary');
        this.triggerConfetti();
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

        Object.entries(stats).forEach(([muscle, count]) => {
            if (count === 0) return;
            const percent = Math.round((count / total) * 100);
            const row = $(`
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>${muscle}</span>
                        <span class="text-emerald-400">${percent}%</span>
                    </div>
                    <div class="muscle-bar">
                        <div class="muscle-fill" style="width: 0%"></div>
                    </div>
                </div>
            `);
            container.append(row);
            setTimeout(() => row.find('.muscle-fill').css('width', `${percent}%`), 100);
        });
    }

    triggerConfetti() {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 } });
            confetti({ particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
        }, 250);
    }

    beep() { try { document.getElementById('audio-beep').play(); } catch (e) { } }
    completeSound() { try { document.getElementById('audio-complete').play(); } catch (e) { } }
}

// Start App
$(document).ready(() => {
    window.app = new WorkoutApp();
});
