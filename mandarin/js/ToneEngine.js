/**
 * ToneEngine handles tone pitch visualization and training.
 */
class ToneEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tones = [
            { id: 1, name: 'Flat', path: 'M 10 50 L 90 50', description: 'High and level' },
            { id: 2, name: 'Rising', path: 'M 10 80 Q 50 80 90 20', description: 'Starts mid, rises to high' },
            { id: 3, name: 'Dipping', path: 'M 10 30 Q 50 90 90 30', description: 'Starts mid-low, dips low, then rises' },
            { id: 4, name: 'Falling', path: 'M 10 20 L 90 80', description: 'Starts high, falls sharply' }
        ];
    }

    renderToneSelector(callback) {
        this.container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                ${this.tones.map(t => `
                    <button class="tone-card p-4 rounded-xl border-2 border-transparent bg-white/50 hover:bg-jade-100 transition-all flex flex-col items-center gap-2" data-tone="${t.id}">
                        <svg viewBox="0 0 100 100" class="w-16 h-16 stroke-jade-600 fill-none stroke-[6]">
                            <path d="${t.path}" />
                        </svg>
                        <span class="font-bold text-mandarin-dark text-sm">Tone ${t.id}</span>
                        <span class="text-[10px] text-gray-500 text-center">${t.description}</span>
                    </button>
                `).join('')}
            </div>
        `;

        this.container.querySelectorAll('.tone-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const tone = parseInt(btn.dataset.tone);
                callback(tone);
            });
        });
    }

    /**
     * Plays the audio for a character using Web Speech API
     */
    playAudio(text) {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }

    highlightTone(toneId) {
        this.container.querySelectorAll('.tone-card').forEach(btn => {
            if (parseInt(btn.dataset.tone) === toneId) {
                btn.classList.add('border-gold-500', 'bg-gold-50');
                btn.classList.remove('bg-white/50');
            } else {
                btn.classList.remove('border-gold-500', 'bg-gold-50');
                btn.classList.add('bg-white/50');
            }
        });
    }
}

export default ToneEngine;
