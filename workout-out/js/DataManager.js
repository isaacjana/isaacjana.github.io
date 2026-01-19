/** 
 * BACKEND: DATA LAYER 
 * Centralizes storage, validation, and schema.
 */
class DataManager {
    constructor() {
        this.KEYS = { SCHED: 'iri_sched', COMP: 'iri_comp', PROF: 'iri_prof', HIST: 'iri_hist', STREAK: 'iri_str' };
        this.defaults = {
            schedule: {
                1: { focus: "Chest & Triceps", color: "#10b981", muscles: ["Chest", "Arms"], exercises: [{ id: "m1", name: "Push Ups", time: 30, target: 15, icon: "fa-hand-rock", rest: 30 }, { id: "m2", name: "Plank Hold", time: 45, target: 1, icon: "fa-stopwatch", rest: 30 }, { id: "m3", name: "Tricep Dips", time: 30, target: 15, icon: "fa-chair", rest: 30 }] },
                2: { focus: "Back & Biceps", color: "#3b82f6", muscles: ["Chest", "Arms"], exercises: [{ id: "tu1", name: "Superman Holds", time: 45, target: 1, icon: "fa-superpowers", rest: 30 }, { id: "tu2", name: "Doorframe Rows", time: 30, target: 15, icon: "fa-columns", rest: 30 }, { id: "tu3", name: "Good Mornings", time: 30, target: 20, icon: "fa-sun", rest: 40 }] },
                3: { focus: "Legs & Glutes", color: "#f59e0b", muscles: ["Legs"], exercises: [{ id: "w1", name: "Air Squats", time: 30, target: 20, icon: "fa-chevron-down", rest: 30 }, { id: "w2", name: "Lunges", time: 45, target: 12, icon: "fa-person-walking", rest: 45 }, { id: "w3", name: "Wall Sit", time: 45, target: 1, icon: "fa-chair", rest: 30 }] },
                4: { focus: "Shoulders & Core", color: "#f43f5e", muscles: ["Arms", "Abs"], exercises: [{ id: "th1", name: "Pike Push Ups", time: 30, target: 10, icon: "fa-mountain", rest: 45 }, { id: "th2", name: "Plank Hold", time: 60, target: 1, icon: "fa-stopwatch", rest: 30 }, { id: "th3", name: "Russian Twists", time: 30, target: 25, icon: "fa-arrows-spin", rest: 30 }] },
                5: { focus: "Full Body Intensity", color: "#ef4444", muscles: ["Chest", "Arms", "Legs", "Abs"], exercises: [{ id: "f1", name: "Burpees", time: 45, target: 10, icon: "fa-fire", rest: 60 }, { id: "f2", name: "Mtn Climbers", time: 40, target: 30, icon: "fa-person-running", rest: 30 }, { id: "f3", name: "Jumping Jacks", time: 30, target: 50, icon: "fa-star", rest: 20 }] },
                6: { focus: "Active Recovery", color: "#10b981", muscles: ["Abs"], exercises: [{ id: "s1", name: "Bird Dog", time: 30, target: 10, icon: "fa-dog", rest: 20 }, { id: "s2", name: "Cat Cow", time: 60, target: 1, icon: "fa-cat", rest: 20 }] },
                0: { focus: "Rest & Mobility", color: "#64748b", muscles: [], exercises: [{ id: "su1", name: "Light Walk", time: 900, target: 1, icon: "fa-shoe-prints", rest: 0 }] }
            },
            profile: { level: 1.0, theme: 'theme-default', sound: 'voice', warmup: false, mode: 'dark' },
            streak: { count: 0, last: null },
            customRoutines: {}, // { "routineId": { name: "My Routine", color: "#...", muscles: [], exercises: [] } }
            achievements: [] // ["early_bird", "streak_7"]
        };

        this.schedule = this._load(this.KEYS.SCHED, this.defaults.schedule);
        this.completed = this._load(this.KEYS.COMP, {});
        this.profile = this._load(this.KEYS.PROF, this.defaults.profile);
        this.history = this._load(this.KEYS.HIST, []);
        this.streak = this._load(this.KEYS.STREAK, this.defaults.streak);
        this.customRoutines = this._load('iri_custom', this.defaults.customRoutines);
        this.achievements = this._load('iri_achievements', this.defaults.achievements);

        // Exercise Library (Static for now, can be extended)
        this.LIBRARY = [
            { id: "lib1", name: "Push Ups", time: 30, target: 15, icon: "fa-hand-rock", muscles: ["Chest", "Arms"] },
            { id: "lib2", name: "Pull Ups", time: 30, target: 8, icon: "fa-dumbbell", muscles: ["Back", "Arms"] },
            { id: "lib3", name: "Squats", time: 30, target: 20, icon: "fa-chevron-down", muscles: ["Legs"] },
            { id: "lib4", name: "Lunges", time: 45, target: 12, icon: "fa-person-walking", muscles: ["Legs"] },
            { id: "lib5", name: "Plank Hold", time: 45, target: 1, icon: "fa-stopwatch", muscles: ["Abs"] },
            { id: "lib6", name: "Burpees", time: 45, target: 10, icon: "fa-fire", muscles: ["Full"] },
            { id: "lib7", name: "Crunches", time: 30, target: 20, icon: "fa-arrows-spin", muscles: ["Abs"] },
            { id: "lib8", name: "Jumping Jacks", time: 30, target: 40, icon: "fa-star", muscles: ["Full"] },
            { id: "lib9", name: "Mtn Climbers", time: 40, target: 30, icon: "fa-person-running", muscles: ["Abs", "Cardio"] },
            { id: "lib10", name: "High Knees", time: 30, target: 40, icon: "fa-person-running", muscles: ["Legs", "Cardio"] }
        ];

        this.ACHIEVEMENTS = [
            { id: "first", name: "First Steps", desc: "Complete 1 workout", icon: "fa-shoe-prints" },
            { id: "early", name: "Early Bird", desc: "Workout before 8am", icon: "fa-sun" },
            { id: "night", name: "Night Owl", desc: "Workout after 8pm", icon: "fa-moon" },
            { id: "weekend", name: "Wknd Warrior", desc: "Workout on Sat/Sun", icon: "fa-calendar-check" },
            { id: "streak3", name: "On Fire", desc: "3 Day Streak", icon: "fa-fire" },
            { id: "iron", name: "Ironborn", desc: "Level 1.5+", icon: "fa-dumbbell" }
        ];
    }

    _load(key, fallback) {
        try {
            const saved = JSON.parse(localStorage.getItem(key));
            return saved ? saved : fallback;
        } catch (e) { console.error("Load Error", e); return fallback; }
    }

    save(key, data) {
        localStorage.setItem(this.KEYS[key] || key, JSON.stringify(data));
    }

    saveRoutine(name, exercises, color = "#6366f1", muscles = ["Full"]) {
        const id = 'rut_' + Date.now();
        this.customRoutines[id] = { id, name, exercises, color, muscles };
        this.save('iri_custom', this.customRoutines);
        return id;
    }

    deleteRoutine(id) {
        if (this.customRoutines[id]) {
            delete this.customRoutines[id];
            this.save('iri_custom', this.customRoutines);
        }
    }

    unlockAchievement(id) {
        if (!this.achievements.includes(id)) {
            this.achievements.push(id);
            this.save('iri_achievements', this.achievements);
            return true;
        }
        return false;
    }

    exportData() {
        const data = {
            schedule: this.schedule,
            completed: this.completed,
            profile: this.profile,
            history: this.history,
            streak: this.streak,
            customRoutines: this.customRoutines,
            achievements: this.achievements
        };
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `dailyburn_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    }

    importData(file, cb) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const d = JSON.parse(e.target.result);
                if (d.schedule) localStorage.setItem(this.KEYS.SCHED, JSON.stringify(d.schedule));
                if (d.history) localStorage.setItem(this.KEYS.HIST, JSON.stringify(d.history));
                // Basic validation: Check if schedule has keys 0-6
                if (d.schedule && !d.schedule['1']) throw new Error("Invalid Schedule Format");
                cb(true, "Data Imported successfully");
            } catch (err) { cb(false, "Invalid Backup File"); }
        };
        reader.readAsText(file);
    }
}
