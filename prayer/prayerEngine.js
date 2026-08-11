// prayerEngine.js - Enhanced Sacred Logic Engine & Audio Generators
import {
    openers,
    closers,
    prayerTemplates,
    virtues,
    rosaryMysteries,
    inspirationQuotes
} from './prayerData.js';

function getRandomItem(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePrayer(category, tone, intention) {
    const validTones = ['traditional', 'simple', 'latin'];
    const validCategories = Object.keys(prayerTemplates);

    tone = validTones.includes(tone) ? tone : 'traditional';
    category = validCategories.includes(category) ? category : 'trials';

    const opener = getRandomItem(openers[tone] || openers.traditional);
    const categoryTemplates = prayerTemplates[category] || prayerTemplates.trials;
    let content = getRandomItem(categoryTemplates[tone] || categoryTemplates.traditional || categoryTemplates.simple);
    const virtue = getRandomItem(virtues[tone] || virtues.traditional);

    const intentionText = (intention && intention.trim() !== "")
        ? intention.trim()
        : getDefaultIntention(category, tone);

    content = content.replace("[USER_INTENTION]", intentionText);
    content = content.replace("[VIRTUE]", virtue);

    const closer = getRandomItem(closers[tone] || closers.traditional);
    const prayer = `${opener} ${content}, ${closer}`;

    return {
        prayer,
        metadata: {
            category,
            tone,
            intention: intentionText,
            virtue,
            timestamp: new Date().toISOString()
        }
    };
}

function getDefaultIntention(category, tone = 'traditional') {
    if (tone === 'latin') {
        const latinDefaults = {
            meals: "hanc mensam et nos",
            gatherings: "hunc conventum nostrum",
            trials: "tribulationes nostras",
            thanksgiving: "beneficia tua",
            guidance: "viam nostram",
            protection: "domum nostram",
            healing: "infirmitates nostras"
        };
        return latinDefaults[category] || "intentiones nostras";
    }

    const defaults = {
        meals: "this meal and those who share it",
        gatherings: "those gathered here today",
        trials: "our struggles and hardships",
        thanksgiving: "Your many blessings in our lives",
        guidance: "the path before us",
        protection: "our home and loved ones",
        healing: "those suffering in mind, body, or spirit"
    };
    return defaults[category] || "our intentions";
}

export function getInspirationQuote() {
    return getRandomItem(inspirationQuotes);
}

export function getTodayRosaryMystery() {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let key = 'glorious';
    switch (dayOfWeek) {
        case 1: // Monday
        case 6: // Saturday
            key = 'joyful';
            break;
        case 2: // Tuesday
        case 5: // Friday
            key = 'sorrowful';
            break;
        case 4: // Thursday
            key = 'luminous';
            break;
        case 0: // Sunday
        case 3: // Wednesday
        default:
            key = 'glorious';
            break;
    }
    return { key, ...rosaryMysteries[key] };
}

// -------------------------------------------------------------
// Web Audio Synthesized Cathedral Bell Soundscape Engine
// -------------------------------------------------------------
class WebAudioBellEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBell(freq = 432, duration = 3.5) {
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            
            // Fundamental tone + overtones for warm bell resonance
            const overtones = [
                { mult: 1.0, gain: 0.5 },
                { mult: 2.0, gain: 0.25 },
                { mult: 2.76, gain: 0.15 },
                { mult: 5.4, gain: 0.08 }
            ];

            const masterGain = this.ctx.createGain();
            masterGain.gain.setValueAtTime(0.001, now);
            masterGain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            masterGain.connect(this.ctx.destination);

            overtones.forEach(ot => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq * ot.mult, now);
                gain.gain.setValueAtTime(ot.gain, now);

                osc.connect(gain);
                gain.connect(masterGain);

                osc.start(now);
                osc.stop(now + duration);
            });
        } catch (e) {
            console.warn("Web Audio chime unavailable:", e);
        }
    }
}

export const bellEngine = new WebAudioBellEngine();

// -------------------------------------------------------------
// SpeechSynthesis Text-to-Speech Companion
// -------------------------------------------------------------
class SpeechCompanion {
    constructor() {
        this.synth = window.speechSynthesis || null;
        this.isSpeaking = false;
        this.currentUtterance = null;
    }

    speak(text, onEnd, onStart) {
        if (!this.synth) {
            alert("Text-to-Speech is not supported in your browser.");
            return;
        }

        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly calm and prayerful pace
        utterance.pitch = 1.0;

        // Try selecting a clear English voice if available
        const voices = this.synth.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Serena') || v.name.includes('Daniel')));
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (onStart) onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.isSpeaking = false;
    }
}

export const ttsCompanion = new SpeechCompanion();

// -------------------------------------------------------------
// Journal / Saved Prayers LocalStorage Engine
// -------------------------------------------------------------
const JOURNAL_KEY = 'oratio_saved_prayers_v1';

export const journalEngine = {
    getAll() {
        try {
            const raw = localStorage.getItem(JOURNAL_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },
    save(prayerItem) {
        const list = this.getAll();
        // Prevent duplicate
        const exists = list.some(item => item.id === prayerItem.id || (item.text === prayerItem.text && item.title === prayerItem.title));
        if (!exists) {
            const newItem = {
                id: prayerItem.id || 'p_' + Date.now(),
                title: prayerItem.title || 'Personal Prayer',
                text: prayerItem.text,
                latinText: prayerItem.latinText || '',
                category: prayerItem.category || 'general',
                dateSaved: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            };
            list.unshift(newItem);
            localStorage.setItem(JOURNAL_KEY, JSON.stringify(list));
            return true;
        }
        return false;
    },
    remove(id) {
        let list = this.getAll();
        list = list.filter(item => item.id !== id);
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(list));
    },
    isSaved(text) {
        const list = this.getAll();
        return list.some(item => item.text === text);
    }
};
