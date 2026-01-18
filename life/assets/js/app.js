import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/module.esm.js';

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
    authDomain: "penny-wise-bfdaa.firebaseapp.com",
    projectId: "penny-wise-bfdaa",
    storageBucket: "penny-wise-bfdaa.firebasestorage.app",
    messagingSenderId: "438298356973",
    appId: "1:438298356973:web:198dc164a067952a4cb0e4"
};

// --- INITIALIZATION ---
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        console.warn("Persistence failed: Browser doesn't support it");
    }
});

// --- ALPINE APPLICATION ---
Alpine.data('app', () => ({
    // UI State
    tab: 'dashboard',
    mobileMenu: false,
    loading: false,
    user: null,

    // System Mode State
    systemMode: localStorage.getItem('masterMode') || 'standard',

    // Data State
    logs: [],
    dailyCalories: parseInt(localStorage.getItem('masterCalories') || '0'),
    lastCalorieDate: localStorage.getItem('masterCalDate') || new Date().toDateString(),

    // Audio Engine
    activeAudio: null,
    audioPlayer: null,
    audioContext: null,
    noiseNode: null,

    // --- WORKOUT ENGINE STATE ---
    readiness: { checked: false, score: 0, hydration: false, salt: false, motivation: 5 },
    restTimer: { active: false, time: 60, initial: 60, interval: null },
    busyTimer: { active: false, time: 20 * 60, initial: 20 * 60, interval: null },
    prs: JSON.parse(localStorage.getItem('masterPRs')) || { pushups: 0, squats: 0, plank: 0 },
    workoutLogs: {}, // Format: { 'ExerciseName': [true, false, false] }

    workoutData: {
        standard: [
            {
                id: 'mon', day: 'Monday', title: 'Legs', icon: 'fa-person-arrow-down-to-line', color: 'master-accent',
                exercises: [
                    { name: 'Box Squats', sets: 3, reps: '15', alt: 'Air Squats' },
                    { name: 'Glute Bridge', sets: 3, reps: '15', alt: 'Cossack Squats' },
                    { name: 'Wall Sit', sets: 3, reps: '45s', alt: 'Plank' }
                ]
            },
            {
                id: 'wed', day: 'Wednesday', title: 'Endurance', icon: 'fa-person-walking', color: 'amber-500',
                exercises: [{ name: 'Zone 2 Cardio', sets: 1, reps: '45m', alt: 'Fast Walk' }]
            },
            {
                id: 'fri', day: 'Friday', title: 'Upper Body', icon: 'fa-person-arms-up', color: 'indigo-500',
                exercises: [
                    { name: 'Incline Push', sets: 3, reps: '12', alt: 'Diamond Pushups' },
                    { name: 'Door Rows', sets: 3, reps: '15', alt: 'Superman' },
                    { name: 'Superman', sets: 3, reps: '10x3s', alt: 'Bird Dog' }
                ]
            }
        ],
        busy: [
            { name: 'Air Squats', target: 100, unit: 'Reps' },
            { name: 'Pushups', target: 50, unit: 'Reps' },
            { name: 'Isometric Plank', target: 180, unit: 'Secs' }
        ]
    },

    // Environment State
    locationName: 'Syncing...',
    sunriseTime: '--:--',
    sunsetTime: '--:--',
    currentTemp: null,

    // Insights
    insights: "Scanning neural patterns...",

    // Reflection
    reflection: { status: 'pending', note: '' },

    // Pomodoro State
    pomodoroTime: 50 * 60,
    pomodoroInitial: 50 * 60,
    pomodoroMode: 'work',
    isTimerRunning: false,
    timerInterval: null,
    currentMicroWorkout: '10 Doorframe Rows',
    microWorkouts: ['10 Doorframe Rows', '20 Air Squats', '30s Wall Sit', '10 Incline Pushups', 'Stretch Hamstrings'],

    // Inputs
    logInput: { weight: '', waist: '', energy: '', sleep: '', note: '' },

    // Tasks
    dailyTasks: JSON.parse(localStorage.getItem('masterTasks')) || [],

    // Navigation Definitions
    navItems: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-home' },
        { id: 'focus', label: 'Deep Work', icon: 'fas fa-brain' },
        { id: 'workout', label: 'Workout', icon: 'fas fa-dumbbell' },
        { id: 'nutrition', label: 'Fuel', icon: 'fas fa-utensils' },
        { id: 'progress', label: 'Correlation', icon: 'fas fa-chart-line' }
    ],

    init() {
        // Watchers for Persistence
        this.$watch('dailyTasks', (val) => {
            localStorage.setItem('masterTasks', JSON.stringify(val));
        });
        this.$watch('prs', (val) => localStorage.setItem('masterPRs', JSON.stringify(val)));

        // Initialize Tasks if empty
        if (this.dailyTasks.length === 0) {
            this.updateTasksForMode();
        }

        // Daily Check-ins
        this.checkDailyReset();
        this.detectLocation();

        // Background refresh every minute
        setInterval(() => this.checkDailyReset(), 60000);

        // Auth Listeners
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                this.fetchLogs();
            } else {
                this.logs = [];
            }
        });
    },

    // --- SYSTEM LOGIC ---
    setMode(mode) {
        if (this.systemMode === mode) return;
        this.systemMode = mode;
        localStorage.setItem('masterMode', mode);
        this.updateTasksForMode();
    },

    updateTasksForMode() {
        const presets = {
            busy: [
                { name: 'Hydrate + Salt', desc: '6:00 AM Essential', completed: false },
                { name: 'Micro-Workout', desc: '20m Survival Protocol', completed: false },
                { name: 'Deep Work', desc: '7:30-13:00 (No Distractions)', completed: false },
                { name: 'Clean Fuel', desc: 'Protein Only Lunch', completed: false }
            ],
            holiday: [
                { name: 'Hydrate', desc: 'Morning Water', completed: false },
                { name: 'Long Walk', desc: 'Explore/Hike', completed: false },
                { name: 'Family Time', desc: 'Disconnect Phone', completed: false },
                { name: 'Read/Learn', desc: '30 mins', completed: false }
            ],
            standard: [
                { name: 'Hydrate', desc: 'Water + Salt', completed: false },
                { name: 'Wim Hof', desc: '3 Rounds Breathing', completed: false },
                { name: 'Deep Work', desc: '7:30 - 13:00 Fasted', completed: false },
                { name: 'Workout', desc: '17:00 Training', completed: false },
                { name: 'Clean Fuel', desc: '13:00 - 20:00', completed: false }
            ]
        };
        this.dailyTasks = presets[this.systemMode] || presets.standard;
    },

    triggerHaptic(type = 'medium') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: [15, 30, 15],
                heavy: [50, 50, 50],
                success: [20, 50, 20]
            };
            navigator.vibrate(patterns[type] || patterns.medium);
        }
    },

    detectLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.fetchWeather(pos.coords.latitude, pos.coords.longitude);
                    this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    // Fallback to Kuching
                    this.fetchWeather(1.5533, 110.3592);
                    this.locationName = "Kuching Node // MY";
                }
            );
        } else {
            this.fetchWeather(1.5533, 110.3592);
            this.locationName = "Kuching Node // MY";
        }
    },

    async reverseGeocode(lat, lon) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            this.locationName = (data.address.city || data.address.town || "Unknown Sector") + " // Local Node";
        } catch (e) {
            this.locationName = "Active Node // Linked";
        }
    },

    async fetchWeather(lat, lon) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&current=temperature_2m&timezone=auto`);
            const data = await res.json();

            this.currentTemp = Math.round(data.current.temperature_2m);
            const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.sunriseTime = fmt(data.daily.sunrise[0]);
            this.sunsetTime = fmt(data.daily.sunset[0]);
        } catch (e) {
            console.warn("Weather sync failed:", e);
        }
    },

    // --- WORKOUT METHODS ---
    calculateReadiness() {
        let score = parseInt(this.readiness.motivation);
        if (this.readiness.hydration) score += 2;
        if (this.readiness.salt) score += 3;
        this.readiness.score = score;
        this.readiness.checked = true;
        this.triggerHaptic('success');
    },

    toggleSet(exerciseName, setIndex) {
        if (!this.workoutLogs[exerciseName]) {
            this.workoutLogs[exerciseName] = [];
        }
        this.workoutLogs[exerciseName][setIndex] = !this.workoutLogs[exerciseName][setIndex];
        this.triggerHaptic('light');

        if (this.workoutLogs[exerciseName][setIndex]) {
            this.startRest();
        }
    },

    startRest() {
        clearInterval(this.restTimer.interval);
        this.restTimer.active = true;
        this.restTimer.time = 60;
        this.restTimer.interval = setInterval(() => {
            if (this.restTimer.time > 0) {
                this.restTimer.time--;
            } else {
                this.stopRest();
            }
        }, 1000);
    },

    stopRest() {
        clearInterval(this.restTimer.interval);
        this.restTimer.active = false;
        new Audio('https://upload.wikimedia.org/wikipedia/commons/3/30/Beep_short.ogg').play().catch(() => { });
        this.triggerHaptic('heavy');
    },

    swapExercise(exercise) {
        const currentName = exercise.name;
        exercise.name = exercise.alt;
        exercise.alt = currentName;
        this.triggerHaptic('medium');
    },

    updatePR(type, val) {
        if (val > this.prs[type]) {
            this.prs[type] = parseInt(val);
            this.triggerHaptic('success');
            alert(`NEW PERSONAL RECORD: ${val} in ${type.toUpperCase()}`);
        }
    },

    calculateInsights() {
        if (this.logs.length < 3) {
            this.insights = "Insufficient data for neural correlation. Log 3+ days.";
            return;
        }

        const recent = this.logs.slice(0, 5);
        const avgEnergy = recent.reduce((acc, l) => acc + (l.energy || 5), 0) / recent.length;
        const avgSleep = recent.reduce((acc, l) => acc + (l.sleep || 0), 0) / recent.length;

        let message = `Neural Analysis: Average energy ${avgEnergy.toFixed(1)}/10. `;

        if (avgSleep < 7) {
            message += "Correlation detected: Low recovery time is suppressing performance. Increase sleep cycle duration.";
        } else if (avgEnergy > 7) {
            message += "System optimized. Peak performance window identified.";
        } else {
            message += "Consistency is stable. Maintain current calorie-to-output ratio.";
        }

        this.insights = message;
    },

    saveReflection() {
        this.triggerHaptic('success');
        // In a real app, we'd save this to Firestore. For now, visual feedback.
        this.reflection.status = 'synced';
        setTimeout(() => this.reflection.status = 'completed', 2000);
    },

    // --- AUDIO ENGINE ---
    toggleAudio(type) {
        if (this.activeAudio === type) {
            this.stopAudio();
            return;
        }

        this.stopAudio();
        this.triggerHaptic('light');

        if (type === 'brown') {
            this.playBrownNoise();
        } else if (type === 'rain') {
            const rainUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Rain_falling_on_pavement.ogg';
            this.playExternalAudio(rainUrl, 'rain');
        } else if (type === 'alpha') {
            this.playBinauralBeat(10, 'alpha'); // 10Hz Alpha for Focus
        } else if (type === 'theta') {
            this.playBinauralBeat(6, 'theta');  // 6Hz Theta for Creativity
        }
    },

    stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.src = '';
            this.audioPlayer = null;
        }
        if (this.noiseNode) {
            try {
                this.noiseNode.stop();
                this.noiseNode.disconnect();
            } catch (e) { }
            this.noiseNode = null;
        }
        this.activeAudio = null;
    },

    playBrownNoise() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const bufferSize = 10 * this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.002;
                lastOut = data[i];
                data[i] *= 3.5; // volume compensation
            }

            this.noiseNode = this.audioContext.createBufferSource();
            this.noiseNode.buffer = buffer;
            this.noiseNode.loop = true;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.3; // Base volume

            this.noiseNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            this.noiseNode.start();
            this.activeAudio = 'brown';
        } catch (e) {
            console.error("Audio Context Error:", e);
            alert("Failed to initialize system audio. Try clicking once on the page first.");
        }
    },

    playExternalAudio(url, type) {
        try {
            this.audioPlayer = new Audio();
            this.audioPlayer.crossOrigin = "anonymous";
            this.audioPlayer.src = url;
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = 0.4;

            const playPromise = this.audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.activeAudio = type;
                }).catch(e => {
                    console.error("External audio failed:", e);
                    if (e.name === 'NotAllowedError') {
                        alert("Audio blocked. Please click anywhere on the page first.");
                    } else {
                        this.activeAudio = null;
                    }
                });
            }
        } catch (e) {
            console.error("Audio instantiation failed:", e);
        }
    },

    playBinauralBeat(frequency, type) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') this.audioContext.resume();

            const leftOsc = this.audioContext.createOscillator();
            const rightOsc = this.audioContext.createOscillator();
            const leftGain = this.audioContext.createGain();
            const rightGain = this.audioContext.createGain();
            const pannerL = this.audioContext.createStereoPanner();
            const pannerR = this.audioContext.createStereoPanner();

            leftOsc.frequency.value = 200;
            rightOsc.frequency.value = 200 + frequency;
            leftGain.gain.value = 0.1;
            rightGain.gain.value = 0.1;
            pannerL.pan.value = -1;
            pannerR.pan.value = 1;

            leftOsc.connect(leftGain).connect(pannerL).connect(this.audioContext.destination);
            rightOsc.connect(rightGain).connect(pannerR).connect(this.audioContext.destination);

            leftOsc.start();
            rightOsc.start();

            this.noiseNode = {
                stop: () => { try { leftOsc.stop(); rightOsc.stop(); } catch (e) { } },
                disconnect: () => { try { leftOsc.disconnect(); rightOsc.disconnect(); } catch (e) { } }
            };
            this.activeAudio = type;
        } catch (e) {
            console.error("Binaural Beat Error:", e);
        }
    },

    // --- AUTHENTICATION ---
    async login() {
        try {
            this.loading = true;
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            alert("Login failed: " + e.message);
        } finally {
            this.loading = false;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            this.user = null;
            this.logs = [];
        } catch (e) {
            console.error("Logout error:", e);
        }
    },

    // --- DATA HANDLING ---
    fetchLogs() {
        if (!this.user) return;
        const q = query(
            collection(db, `users/${this.user.uid}/master_logs`),
            orderBy('timestamp', 'desc')
        );

        onSnapshot(q, (snapshot) => {
            this.logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.updateChart();
        });
    },

    async addLog() {
        if (!this.user || !this.logInput.weight) {
            alert("Weight is required.");
            return;
        }

        this.loading = true;
        try {
            await addDoc(collection(db, `users/${this.user.uid}/master_logs`), {
                weight: parseFloat(this.logInput.weight),
                waist: parseFloat(this.logInput.waist) || '-',
                energy: parseInt(this.logInput.energy) || 5,
                sleep: parseFloat(this.logInput.sleep) || 0,
                note: this.logInput.note || '',
                dateString: new Date().toLocaleDateString('en-GB'),
                timestamp: serverTimestamp()
            });

            // Clear inputs
            const currentNote = this.logInput.note;
            this.logInput = { weight: '', waist: '', energy: '', sleep: '', note: currentNote };
            this.tab = 'progress';
        } catch (e) {
            console.error("Error adding log:", e);
            alert("Failed to save log.");
        } finally {
            this.loading = false;
        }
    },

    exportData() {
        if (!this.logs.length) return alert("No data to export.");

        let csv = "Date,Weight,Waist,Sleep,Energy,Note\n";
        csv += this.logs.map(l => {
            const note = l.note ? `"${l.note.replace(/"/g, '""')}"` : '""';
            return `${l.dateString},${l.weight},${l.waist},${l.sleep || 0},${l.energy},${note}`;
        }).join("\n");

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `life-os-export-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    addFood(cal) {
        this.dailyCalories += cal;
        localStorage.setItem('masterCalories', this.dailyCalories);
    },

    checkDailyReset() {
        const today = new Date().toDateString();

        // Reset tasks for new day
        if (localStorage.getItem('masterLastLogin') !== today) {
            this.updateTasksForMode();
            localStorage.setItem('masterLastLogin', today);
        }

        // Reset calories for new day
        if (this.lastCalorieDate !== today) {
            this.dailyCalories = 0;
            this.lastCalorieDate = today;
            localStorage.setItem('masterCalories', '0');
            localStorage.setItem('masterCalDate', today);
        }
    },


    // --- COMPUTED PROPERTIES ---
    get playerLevel() {
        const count = this.logs.length;
        const levels = [
            { name: 'Novice', threshold: 0, max: 15 },
            { name: 'Apprentice', threshold: 15, max: 50 },
            { name: 'Adept', threshold: 50, max: 100 },
            { name: 'Master', threshold: 100, max: 1000 }
        ];

        let currentLevel = levels[0];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (count >= levels[i].threshold) {
                currentLevel = levels[i];
                break;
            }
        }

        const progress = Math.min(100, ((count - currentLevel.threshold) / (currentLevel.max - currentLevel.threshold)) * 100);
        return {
            name: currentLevel.name,
            rank: levels.indexOf(currentLevel) + 1,
            next: currentLevel.max,
            width: progress
        };
    },

    get circadianMessage() {
        const h = new Date().getHours();
        if (h >= 5 && h < 9) return "View morning sunlight immediately";
        if (h >= 9 && h < 12) return "Peak focus window. Deep work only.";
        if (h >= 12 && h < 15) return "Afternoon dip. Movement or cold water.";
        if (h >= 15 && h < 18) return "Late afternoon light. Exercise window.";
        if (h >= 18 && h < 21) return "Dim lights. Alcohol/Caffeine cutoff.";
        if (h >= 21 || h < 5) return "Deep rest protocol. No blue light.";
        return "Stay focused.";
    },

    get pomodoroProgress() {
        return ((this.pomodoroInitial - this.pomodoroTime) / this.pomodoroInitial) * 100;
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    toggleBusyTimer() {
        if (this.busyTimer.active) {
            clearInterval(this.busyTimer.interval);
            this.busyTimer.active = false;
        } else {
            this.busyTimer.active = true;
            this.busyTimer.interval = setInterval(() => {
                if (this.busyTimer.time > 0) {
                    this.busyTimer.time--;
                    if (this.busyTimer.time === 600) this.triggerHaptic('heavy'); // 10m alert
                } else {
                    clearInterval(this.busyTimer.interval);
                    this.busyTimer.active = false;
                }
            }, 1000);
        }
    },

    toggleTimer() {
        if (this.isTimerRunning) {
            clearInterval(this.timerInterval);
            this.isTimerRunning = false;
        } else {
            this.isTimerRunning = true;
            this.timerInterval = setInterval(() => {
                if (this.pomodoroTime > 0) {
                    this.pomodoroTime--;
                } else {
                    this.completeTimer();
                }
            }, 1000);
        }
    },

    resetTimer() {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
        this.pomodoroMode = 'work';
        this.pomodoroTime = 50 * 60;
        this.pomodoroInitial = 50 * 60;
    },

    completeTimer() {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;

        const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/3/30/Beep_short.ogg');
        audio.play().catch(() => { });

        if (this.pomodoroMode === 'work') {
            this.pomodoroMode = 'break';
            this.pomodoroTime = 10 * 60;
            this.pomodoroInitial = 10 * 60;
            this.currentMicroWorkout = this.microWorkouts[Math.floor(Math.random() * this.microWorkouts.length)];
        } else {
            this.pomodoroMode = 'work';
            this.pomodoroTime = 50 * 60;
            this.pomodoroInitial = 50 * 60;
        }
    },

    get bmi() {
        if (!this.logs.length) return 23.5; // Placeholder
        const latest = this.logs[0];
        // Hardcoded height 1.72m for now from original code
        return (latest.weight / (1.72 * 1.72)).toFixed(1);
    },

    get bmiColor() {
        const val = parseFloat(this.bmi);
        if (val < 18.5) return 'text-blue-400';
        if (val < 25) return 'text-emerald-400';
        if (val < 30) return 'text-yellow-500';
        return 'text-red-500';
    },

    get whtr() {
        if (!this.logs.length || this.logs[0].waist === '-') return 0;
        return (parseFloat(this.logs[0].waist) / 172).toFixed(2);
    },

    get whtrStatus() {
        const r = parseFloat(this.whtr);
        if (r === 0) return { text: 'No Data', color: 'text-gray-500' };
        if (r <= 0.5) return { text: 'Optimal', color: 'text-emerald-400' };
        return { text: 'High Risk', color: 'text-red-500' };
    },

    get waterGoal() {
        const weight = this.logs.length ? this.logs[0].weight : 75;
        return (weight * 0.033).toFixed(1);
    },

    toggleTask(index) {
        this.dailyTasks[index].completed = !this.dailyTasks[index].completed;
        // Trigger Alpine reactivity
        this.dailyTasks = [...this.dailyTasks];
    },

    // --- CHARTING ---
    chartInstance: null,
    updateChart() {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;

        const data = [...this.logs].reverse();
        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(l => l.dateString.slice(0, 5)),
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: data.map(l => l.weight),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Sleep (hrs)',
                        data: data.map(l => l.sleep || null),
                        borderColor: '#3b82f6',
                        borderDash: [5, 5],
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(51, 65, 85, 0.5)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { display: false },
                        ticks: { color: '#3b82f6' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
}));

// Start Alpine
Alpine.start();
