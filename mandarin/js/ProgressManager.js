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
            dailyQuests: {
                date: null,
                tasks: []
            },
            xpHistory: {}, // 'YYYY-MM-DD': amount
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

        // Check Quests
        this.checkQuests('review', 1);

        this.saveProgress();
    }

    addXP(amount) {
        this.progress.xp += amount;

        // Track History
        const today = new Date().toDateString();
        if (!this.progress.xpHistory) this.progress.xpHistory = {};
        this.progress.xpHistory[today] = (this.progress.xpHistory[today] || 0) + amount;

        this.updateStreak();
        this.checkQuests('xp', amount);
        this.saveProgress();
    }

    updateStreak() {
        const today = new Date().toDateString();
        this.checkDailyReset();

        if (this.progress.lastActive === today) return;

        const lastDate = this.progress.lastActive ? new Date(this.progress.lastActive) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
            this.progress.streak++;
        } else if (!lastDate || lastDate.toDateString() !== today) {
            // Only reset if it wasn't today (already handled by first check) 
            // and wasn't yesterday.
            this.progress.streak = 1;
        }

        this.progress.lastActive = today;
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.progress.dailyQuests.date !== today) {
            // Generate New Quests
            this.progress.dailyQuests = {
                date: today,
                tasks: [
                    { id: 'xp_100', type: 'xp', target: 100, current: 0, title: 'Gain 100 Qi (XP)', reward: 50, completed: false },
                    { id: 'review_5', type: 'review', target: 5, current: 0, title: 'Review 5 Scrolls', reward: 30, completed: false },
                    { id: 'perfect_3', type: 'perfect', target: 3, current: 0, title: '3 Perfect Invocations', reward: 40, completed: false }
                ]
            };
        }
    }

    checkQuests(type, amount) {
        let updated = false;
        this.progress.dailyQuests.tasks.forEach(task => {
            if (!task.completed && task.type === type) {
                task.current += amount;
                if (task.current >= task.target) {
                    task.current = task.target;
                    task.completed = true;
                    this.addXP(task.reward); // Recurse? No, reward adds XP, which triggers checkQuests('xp').
                    // Be careful of infinite loops if we had an "earn reward" quest type. We don't.
                    // But 'xp' quest reward triggers 'xp' check again. 
                    // Safe because the 'xp' quest will be marked completed before recursion or doesn't match 'xp' loop condition?
                    // Actually addXP calls checkQuests('xp'). 
                    // To avoid stack overflow: if task just completed, mark it first.
                    updated = true;
                    // Trigger toast in UI? (Need a callback or event system. For now, passive.)
                }
                updated = true;
            }
        });
        if (updated) this.saveProgress();
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
        this.checkDailyReset();
        const mastered = Object.values(this.progress.mastery).filter(m => m.interval > 30).length;

        // Prepare chart data (last 7 days)
        const history = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            history.push({
                label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
                value: this.progress.xpHistory ? (this.progress.xpHistory[key] || 0) : 0
            });
        }

        return {
            xp: this.progress.xp,
            streak: this.progress.streak,
            charsLearned: Object.keys(this.progress.mastery).length,
            charsMastered: mastered,
            guardian: this.getGuardianStage(),
            quests: this.progress.dailyQuests.tasks,
            chartData: history
        };
    }
}

export default ProgressManager;
