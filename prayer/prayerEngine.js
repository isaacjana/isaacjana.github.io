
// prayerEngine.js
import { openers, closers, prayerTemplates } from './prayerData.js';

export function generatePrayer(category, tone, intention) {
    // 1. Select Opener
    const openerList = openers[tone] || openers['traditional'];
    const opener = openerList[Math.floor(Math.random() * openerList.length)];

    // 2. Select Template
    // Ensure category exists, else fallback to 'generic' (if logic allows, or handle error)
    // Here we map 'meals', 'gatherings', 'trials' from UI values.
    let catKey = category;
    if (!prayerTemplates[catKey]) {
        catKey = 'generic';
    }

    // If category is trials/generic but intention is empty, maybe switch to generic? 
    // But let's assume UI validation or fallback text.

    const templateList = prayerTemplates[catKey][tone] || prayerTemplates[catKey]['traditional'];
    let content = templateList[Math.floor(Math.random() * templateList.length)];

    // 3. Inject Intention
    const intentionText = (intention && intention.trim() !== "") ? intention.trim() : "our intentions";
    content = content.replace("[User Intention]", intentionText);

    // 4. Select Closer
    const closerList = closers[tone] || closers['traditional'];
    const closer = closerList[Math.floor(Math.random() * closerList.length)];

    // Assemble
    return `${opener} ${content} ${closer}`;
}
