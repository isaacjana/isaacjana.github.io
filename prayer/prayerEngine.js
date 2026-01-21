// prayerEngine.js - Enhanced Prayer Generation Engine
import { openers, closers, prayerTemplates, virtues } from './prayerData.js';

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePrayer(category, tone, intention) {
    const validTones = ['traditional', 'simple'];
    const validCategories = Object.keys(prayerTemplates);

    tone = validTones.includes(tone) ? tone : 'traditional';
    category = validCategories.includes(category) ? category : 'trials';

    const opener = getRandomItem(openers[tone]);
    let content = getRandomItem(prayerTemplates[category][tone]);
    const virtue = getRandomItem(virtues[tone]);

    const intentionText = (intention && intention.trim() !== "")
        ? intention.trim()
        : getDefaultIntention(category);

    content = content.replace("[USER_INTENTION]", intentionText);
    content = content.replace("[VIRTUE]", virtue);

    const closer = getRandomItem(closers[tone]);
    const prayer = `${opener} ${content}, ${closer}`;

    return { prayer, metadata: { category, tone, intention: intentionText, virtue } };
}

function getDefaultIntention(category) {
    const defaults = {
        meals: "this meal and those who share it",
        gatherings: "those gathered here",
        trials: "our struggles and hardships",
        thanksgiving: "Your many blessings",
        guidance: "the path before us"
    };
    return defaults[category] || "our intentions";
}

export function getInspirationQuote() {
    const quotes = [
        { text: "Pray as though everything depended on God.", author: "St. Ignatius" },
        { text: "Prayer is the raising of one's mind and heart to God.", author: "St. John Damascene" },
        { text: "The prayer of a righteous person is powerful.", author: "James 5:16" }
    ];
    return getRandomItem(quotes);
}
