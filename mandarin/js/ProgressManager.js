/**
 * ProgressManager handles user state, SRS logic (SM-2), and curriculum loading.
 */
class ProgressManager {
    constructor() {
        this.STORAGE_KEY = 'mandarin_flow_progress';
        this.progress = this.loadProgress();
        this.curriculum = null;
    }

    /**
     * Loads the curriculum from the JSON file.
     */
    async loadCurriculum() {
        try {
            const response = await fetch('./data/curriculum.json');
            const data = await response.json();
            this.curriculum = data.curriculum;
            return this.curriculum;
        } catch (error) {
            console.error('Failed to load curriculum:', error);
            return null;
        }
    }

    /**
     * Loads user progress from localStorage.
     */
    loadProgress() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            xp: 0,
            streak: 0,
            lastActive: null,
            mastery: {} // charId: { n, ef, interval, nextReview, history: [] }
        };
    }

    /**
     * Saves user progress to localStorage.
     */
    saveProgress() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progress));
    }

    /**
     * Updates character mastery using SM-2 algorithm.
     * @param {string} charId 
     * @param {number} quality (0-5)
     */
    updateMastery(charId, quality) {
        let item = this.progress.mastery[charId] || {
            n: 0,
            ef: 2.5,
            interval: 0,
            nextReview: Date.now(),
            history: []
        };

        // SM-2 Algorithm logic
        if (quality >= 3) {
            if (item.n === 0) {
                item.interval = 1;
            } else if (item.n === 1) {
                item.interval = 6;
            } else {
                item.interval = Math.round(item.interval * item.ef);
            }
            item.n++;
        } else {
            item.n = 0;
            item.interval = 1;
        }

        // Update Ease Factor
        item.ef = item.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (item.ef < 1.3) item.ef = 1.3;

        // Calculate next review (milliseconds)
        const dayInMs = 24 * 60 * 60 * 1000;
        item.nextReview = Date.now() + (item.interval * dayInMs);
        
        // Add to history
        item.history.push({ date: Date.now(), quality });

        this.progress.mastery[charId] = item;
        
        // Add XP
        this.addXP(quality * 10);
        
        this.saveProgress();
    }

    addXP(amount) {
        this.progress.xp += amount;
        this.updateStreak();
        this.saveProgress();
    }

    updateStreak() {
        const today = new Date().toDateString();
        if (this.progress.lastActive === today) return;

        const lastDate = this.progress.lastActive ? new Date(this.progress.lastActive) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
            this.progress.streak++;
        } else {
            this.progress.streak = 1;
        }

        this.progress.lastActive = today;
    }

    getGuardianStage() {
        const xp = this.progress.xp;
        if (xp < 500) return 'Egg';
        if (xp < 2000) return 'Hatchling';
        if (xp < 10000) return 'Drakeling';
        return 'Dragon';
    }

    getReviewItems() {
        const now = Date.now();
        return Object.keys(this.progress.mastery).filter(id => {
            return this.progress.mastery[id].nextReview <= now;
        });
    }

    getStats() {
        const mastered = Object.values(this.progress.mastery).filter(m => m.interval > 30).length;
        return {
            xp: this.progress.xp,
            streak: this.progress.streak,
            charsLearned: Object.keys(this.progress.mastery).length,
            charsMastered: mastered,
            guardian: this.getGuardianStage()
        };
    }
}

export default ProgressManager;
