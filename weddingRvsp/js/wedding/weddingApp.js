import { db, collection, addDoc, query, where, getDocs } from '../services/firebaseService.js';
import { showToast, showError } from '../components/ui.js';
import { initAnimations, initCursor } from '../components/animations.js';

const CONFIG = {
    countdownUpdateInterval: 60000
};

const AppState = {
    currentClientId: null,
    currentClientData: null
};

const WeddingApp = {
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('e');

        if (!slug) {
            showError("Please use a valid invitation link.");
            return;
        }

        try {
            const q = query(collection(db, "clients"), where("slug", "==", slug));
            const snap = await getDocs(q);

            if (snap.empty) {
                showError("Wedding event not found.");
                return;
            }

            const docSnap = snap.docs[0];
            AppState.currentClientId = docSnap.id;
            AppState.currentClientData = docSnap.data();

            this.setupUI();
            this.handleGuestEntrance();
            this.createParticles();
            this.setupEventHandlers();
            initCursor();
        } catch (err) {
            console.error("Error loading wedding:", err);
            showError("Unable to connect to service. Please try again later.");
        }
    },

    setupUI() {
        const data = AppState.currentClientData;
        document.title = `${data.names} | Wedding Invitation`;

        // Helper function to set text content
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value || "";
        };

        // Set main content
        setText('display-names', data.names);
        setText('display-date', data.date);
        setText('display-venue', data.venue?.toUpperCase());
        setText('display-quote', data.quote || "Once in a while, right in the middle of an ordinary life, love gives us a fairytale.");
        setText('venue-details', `Our celebration will be held at ${data.venue}.`);
        setText('venue-address', data.venue);

        // Set initials
        const initials = data.names.split('&').map(s => s.trim()[0]).join(' & ');
        setText('display-initials', initials);

        const loaderLogo = document.querySelector('.loader-logo');
        if (loaderLogo) loaderLogo.innerText = initials;

        // Toggle optional sections
        this.toggleSection('registry-section', !!data.registry, 'display-registry', data.registry, true);
        this.toggleSection('accommodation-section', !!data.accommodation, 'display-accommodation', data.accommodation);

        // Apply theme
        if (data.theme) {
            document.body.classList.add(`theme-${data.theme}`);
        }

        // Initialize features
        this.initCountdown(data.date);
        this.initMaps(data.venue);
    },

    setupEventHandlers() {
        // Scroll to RSVP function
        document.getElementById('btn-join-celebration')?.addEventListener('click', () => {
            document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' });
        });
    },

    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        const particleCount = window.innerWidth < 768 ? 15 : 25;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            particle.style.opacity = 0.2 + Math.random() * 0.4;
            container.appendChild(particle);
        }
    },

    toggleSection(sectionId, condition, displayId, value, isLink = false) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        section.style.display = condition ? 'block' : 'none';

        if (condition && value) {
            const displayEl = document.getElementById(displayId);
            if (displayEl) {
                if (isLink) {
                    displayEl.href = value;
                } else {
                    displayEl.innerText = value;
                }
            }
        }
    },

    handleGuestEntrance() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const sessionAuth = sessionStorage.getItem(`auth_${AppState.currentClientId}`);

        if (code) {
            this.verifyGuest(code);
        } else if (sessionAuth) {
            this.unlockInvite();
        } else {
            // Show authentication section
            const authSection = document.getElementById('guest-auth');
            if (authSection) authSection.style.display = 'block';

            this.setupAuthListeners();
            initAnimations();
        }
    },

    setupAuthListeners() {
        const verifyBtn = document.getElementById('btn-verify');
        const codeInput = document.getElementById('auth-code');

        if (verifyBtn) {
            verifyBtn.onclick = () => {
                const code = codeInput?.value?.trim();
                this.verifyGuest(code);
            };
        }

        // Allow Enter key to submit
        if (codeInput) {
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.verifyGuest(codeInput.value.trim());
                }
            });

            // Auto-focus the input
            setTimeout(() => codeInput.focus(), 500);
        }
    },

    async verifyGuest(code) {
        if (!code || code.length < 4) {
            showToast("Please enter a valid 4-digit code.", "⚠️");
            return;
        }

        const verifyBtn = document.getElementById('btn-verify');
        if (verifyBtn) {
            verifyBtn.classList.add('loading');
            verifyBtn.disabled = true;
        }

        try {
            const q = query(
                collection(db, "clients", AppState.currentClientId, "invites"),
                where("code", "==", code)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                sessionStorage.setItem(`auth_${AppState.currentClientId}`, "true");
                this.unlockInvite();
            } else {
                showToast("Invalid code. Please try again.", "🔒");
                this.shakeInput();
            }
        } catch (err) {
            console.error("Verification error:", err);
            showToast("Connection error. Please try again.", "⚠️");
        } finally {
            if (verifyBtn) {
                verifyBtn.classList.remove('loading');
                verifyBtn.disabled = false;
            }
        }
    },

    shakeInput() {
        const input = document.getElementById('auth-code');
        if (input && typeof gsap !== 'undefined') {
            gsap.to(input, {
                x: 10,
                duration: 0.1,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    input.value = '';
                    input.focus();
                }
            });
        }
    },

    unlockInvite() {
        const authSection = document.getElementById('guest-auth');
        const rsvpForm = document.getElementById('rsvp-form');

        if (typeof gsap !== 'undefined') {
            gsap.to(authSection, {
                opacity: 0,
                scale: 0.95,
                duration: 0.6,
                onComplete: () => {
                    if (authSection) authSection.style.display = 'none';
                    if (rsvpForm) rsvpForm.style.display = 'block';

                    gsap.from(rsvpForm, {
                        opacity: 0,
                        y: 20,
                        duration: 0.6
                    });

                    this.initRSVPForm();
                    if(authSection && authSection.style.display === 'none') {
                         initAnimations();
                    }
                }
            });
        } else {
            if (authSection) authSection.style.display = 'none';
            if (rsvpForm) rsvpForm.style.display = 'block';
            this.initRSVPForm();
            initAnimations();
        }
    },

    initRSVPForm() {
        const form = document.getElementById('rsvp-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitRSVP();
        });

        // Handle attendance change - update guest count visibility
        const attendanceSelect = document.getElementById('attendance');
        const guestCountGroup = document.getElementById('guest-count')?.closest('.form-group');

        if (attendanceSelect && guestCountGroup) {
            attendanceSelect.addEventListener('change', () => {
                guestCountGroup.style.opacity = attendanceSelect.value === 'declined' ? '0.5' : '1';
            });
        }
    },

    async submitRSVP() {
        const submitBtn = document.getElementById('btn-submit-rsvp');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        const formData = {
            name: document.getElementById('guest-name')?.value?.trim(),
            attendance: document.getElementById('attendance')?.value,
            guests: parseInt(document.getElementById('guest-count')?.value) || 1,
            dietary: document.getElementById('dietary')?.value?.trim() || '',
            message: document.getElementById('guest-message')?.value?.trim() || '',
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "clients", AppState.currentClientId, "rsvps"), formData);

            showToast("RSVP Confirmed! Thank you.", "🥂");
            this.showSuccessState(formData);
            this.triggerCelebration();
        } catch (err) {
            console.error("RSVP submission error:", err);
            showToast("Failed to send RSVP. Please try again.", "⚠️");

            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    },

    showSuccessState(formData) {
        const rsvpCard = document.querySelector('.rsvp-card');
        const successDiv = document.getElementById('rsvp-success');
        const successMsg = document.getElementById('success-message');

        if (successMsg) {
            const firstName = formData.name.split(' ')[0];
            successMsg.innerText = formData.attendance === 'attending'
                ? `We've received your response, ${firstName}. We can't wait to celebrate with you!`
                : `Thank you for letting us know, ${firstName}. We'll miss you!`;
        }

        if (typeof gsap !== 'undefined' && rsvpCard) {
            gsap.to('#rsvp-form', {
                opacity: 0,
                y: -30,
                duration: 0.5,
                onComplete: () => {
                    document.getElementById('rsvp-form').style.display = 'none';
                    if (successDiv) {
                        successDiv.style.display = 'block';
                        gsap.from(successDiv, { opacity: 0, y: 20, duration: 0.6 });
                    }
                }
            });
        } else {
            document.getElementById('rsvp-form').style.display = 'none';
            if (successDiv) successDiv.style.display = 'block';
        }
    },

    triggerCelebration() {
        if (typeof confetti !== 'undefined') {
            // Initial burst
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d4af37', '#f1d592', '#ffffff']
            });

            // Delayed side bursts
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.6 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.6 }
                });
            }, 250);
        }
    },

    initCountdown(dateStr) {
        const targetDate = new Date(dateStr).getTime();
        if (isNaN(targetDate)) return;

        const update = () => {
            const now = Date.now();
            const diff = targetDate - now;

            const countdownEl = document.getElementById('countdown');
            if (diff < 0) {
                if (countdownEl) countdownEl.style.display = 'none';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            const setCount = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.innerText = val.toString().padStart(2, '0');
            };

            setCount('days', days);
            setCount('hours', hours);
            setCount('mins', mins);
        };

        update();
        setInterval(update, CONFIG.countdownUpdateInterval);
    },

    initMaps(venue) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || !venue) return;

        const iframe = document.createElement('iframe');
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.style.border = "0";
        iframe.loading = "lazy";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(venue)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

        // Clear skeleton loader
        mapContainer.innerHTML = '';
        mapContainer.appendChild(iframe);

        // Set directions link
        const directionsBtn = document.getElementById('btn-directions');
        if (directionsBtn) {
            directionsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
        }
    }
};

window.addEventListener('load', () => {
    WeddingApp.init();
});
