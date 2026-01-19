/**
 * Wedding RSVP Application
 * Handles both guest-facing wedding invitation experience and admin management portal
 */

import {
    db, auth, provider,
    signInWithPopup, onAuthStateChanged, signOut,
    collection, addDoc, onSnapshot, query, orderBy,
    doc, setDoc, deleteDoc, where, getDocs, getDoc
} from './firebase-config.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    adminEmail: "isaacjana.h@gmail.com",
    toastDuration: 4000,
    animationDuration: 0.8,
    countdownUpdateInterval: 60000
};

// ============================================
// STATE MANAGEMENT
// ============================================

const AppState = {
    currentClientId: null,
    currentClientData: null,
    unsubscribers: [],
    isAuthenticated: false
};

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('e');
    const isAdminRequested = urlParams.has('admin');

    if (window.isAdminPage || isAdminRequested) {
        if (!window.isAdminPage) {
            window.location.href = `admin.html${window.location.search}`;
            return;
        }
        AdminApp.init();
    } else if (eventSlug) {
        WeddingApp.init();
    } else {
        showError("Invalid link. Please check your invitation.");
    }
});

// ============================================
// WEDDING APP (Guest Experience)
// ============================================

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
                    initAnimations();
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

// ============================================
// ADMIN APP
// ============================================

const AdminApp = {
    init() {
        this.hideLoader();
        this.showAdminView();
        this.setupAuthListener();
        this.setupEventListeners();
    },

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    },

    showAdminView() {
        const adminView = document.getElementById('admin-view');
        const mainContent = document.getElementById('main-content');

        if (adminView) adminView.style.display = 'grid';
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.display = 'block';
        }
    },

    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            const loginSection = document.getElementById('admin-login-section');
            const contentSection = document.getElementById('admin-content');
            const userInfo = document.getElementById('user-info');
            const userEmail = document.getElementById('user-email');

            if (user && user.email === CONFIG.adminEmail) {
                AppState.isAuthenticated = true;

                if (loginSection) loginSection.style.display = 'none';
                if (contentSection) contentSection.style.display = 'contents';

                // Show user info
                if (userInfo) userInfo.style.display = 'flex';
                if (userEmail) userEmail.innerText = user.email;

                this.loadClients();
            } else {
                AppState.isAuthenticated = false;

                if (user) {
                    showToast("Unauthorized access.", "⚠️");
                    signOut(auth);
                }

                if (loginSection) loginSection.style.display = 'flex';
                if (contentSection) contentSection.style.display = 'none';
            }
        });
    },

    setupEventListeners() {
        // Auth buttons
        document.getElementById('login-btn')?.addEventListener('click', () => {
            signInWithPopup(auth, provider).catch(err => {
                console.error("Sign in error:", err);
                showToast("Sign in failed. Please try again.", "⚠️");
            });
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.cleanup();
            signOut(auth);
        });

        // Navigation
        document.getElementById('nav-clients')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTab('clients');
        });

        document.getElementById('nav-invites')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTab('invites');
        });

        document.getElementById('nav-rsvps')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTab('rsvps');
        });

        document.getElementById('btn-back-to-clients')?.addEventListener('click', () => this.showTab('clients'));
        document.getElementById('btn-back-to-clients-from-invites')?.addEventListener('click', () => this.showTab('clients'));

        // Client modal
        document.getElementById('btn-add-client')?.addEventListener('click', () => this.openClientModal());
        document.getElementById('btn-close-modal')?.addEventListener('click', () => this.closeClientModal());
        document.getElementById('btn-cancel-modal')?.addEventListener('click', () => this.closeClientModal());
        document.getElementById('client-form')?.addEventListener('submit', (e) => this.handleClientSubmit(e));

        // Invite modal
        document.getElementById('btn-add-invite')?.addEventListener('click', () => this.openInviteModal());
        document.getElementById('btn-close-invite-modal')?.addEventListener('click', () => this.closeInviteModal());
        document.getElementById('btn-cancel-invite-modal')?.addEventListener('click', () => this.closeInviteModal());
        document.getElementById('invite-form')?.addEventListener('submit', (e) => this.handleInviteSubmit(e));

        // QR modal
        document.getElementById('btn-close-qr-modal')?.addEventListener('click', () => this.closeQRModal());
        document.getElementById('btn-copy-qr-url')?.addEventListener('click', () => {
            const urlInput = document.getElementById('qr-url');
            if (urlInput) {
                navigator.clipboard.writeText(urlInput.value);
                showToast("Link copied to clipboard!", "📋");
            }
        });

        // Confirm modal
        document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => this.closeConfirmModal());

        // Export
        document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportRSVPsToCSV());

        // Search
        document.getElementById('client-search')?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('#client-list .client-card').forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(term) ? 'block' : 'none';
            });
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    },

    cleanup() {
        AppState.unsubscribers.forEach(unsub => unsub());
        AppState.unsubscribers = [];
        AppState.currentClientId = null;
        AppState.currentClientData = null;
    },

    showTab(tab) {
        const views = ['view-clients', 'view-rsvps', 'view-invites'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });

        const activeView = document.getElementById(`view-${tab}`);
        if (activeView) activeView.style.display = 'block';

        // Update navigation
        const navs = ['nav-clients', 'nav-rsvps', 'nav-invites'];
        navs.forEach(n => {
            const el = document.getElementById(n);
            if (el) {
                el.classList.toggle('active', n === `nav-${tab}`);
                if (n !== 'nav-clients') {
                    el.style.display = AppState.currentClientId ? 'flex' : 'none';
                }
            }
        });

        // Reset to dashboard clears selected client
        if (tab === 'clients') {
            AppState.currentClientId = null;
            AppState.currentClientData = null;
        }
    },

    loadClients() {
        const clientList = document.getElementById('client-list');
        const emptyState = document.getElementById('clients-empty');

        if (!clientList) return;

        const unsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
            clientList.innerHTML = '';

            if (snapshot.empty) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const card = this.createClientCard(docSnap.id, data);
                clientList.appendChild(card);
            });
        });

        AppState.unsubscribers.push(unsubscribe);
    },

    createClientCard(id, data) {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="serif">${this.escapeHtml(data.names)}</h3>
                    <div class="slug">/${this.escapeHtml(data.slug)}</div>
                </div>
                <div class="status-indicator"></div>
            </div>
            
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="meta-label">Event Date</span>
                    <span class="meta-value">${this.escapeHtml(data.date)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Theme</span>
                    <span class="meta-value">${this.formatTheme(data.theme)}</span>
                </div>
            </div>

            <div class="client-actions">
                <button class="btn btn-outline btn-small" data-action="guests" data-id="${id}" data-names="${this.escapeHtml(data.names)}">
                    <span>👥</span> Guests
                </button>
                <button class="btn btn-outline btn-small" data-action="invites" data-id="${id}" data-names="${this.escapeHtml(data.names)}" data-slug="${this.escapeHtml(data.slug)}">
                    <span>💌</span> Invites
                </button>
                <button class="btn btn-outline btn-small" data-action="edit" data-id="${id}">
                    <span>✏️</span> Edit
                </button>
                <a href="index.html?e=${this.escapeHtml(data.slug)}" target="_blank" class="btn btn-outline btn-small">
                    <span>🔗</span> Preview
                </a>
                <button class="btn btn-outline btn-small" data-action="delete" data-id="${id}" style="color: var(--danger); border-color: rgba(231, 76, 60, 0.2);">
                    <span>🗑️</span>
                </button>
            </div>
        `;

        // Add event listeners
        card.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const targetId = e.currentTarget.dataset.id;

                switch (action) {
                    case 'guests':
                        this.viewRSVPs(targetId, e.currentTarget.dataset.names);
                        break;
                    case 'invites':
                        this.viewInvites(targetId, e.currentTarget.dataset.names, e.currentTarget.dataset.slug);
                        break;
                    case 'edit':
                        this.editClient(targetId);
                        break;
                    case 'delete':
                        this.showConfirmModal(
                            'Delete Event',
                            'Are you sure you want to delete this wedding event? All invitations and RSVPs will be permanently removed.',
                            () => this.deleteClient(targetId)
                        );
                        break;
                }
            });
        });

        return card;
    },

    formatTheme(theme) {
        const themes = {
            'classic-emerald': 'Emerald Green',
            'royal-dark': 'Royal Onyx',
            'midnight-garden': 'Midnight Navy',
            'classic-light': 'Pearl White',
            'rose-gold': 'Rose Gold'
        };
        return themes[theme] || 'Classic';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Client Management
    openClientModal(isEdit = false) {
        const modal = document.getElementById('client-modal');
        const title = document.getElementById('modal-title');

        if (title) title.innerText = isEdit ? "Edit Event" : "New Event";
        if (!isEdit) {
            document.getElementById('client-id').value = "";
            document.getElementById('client-form').reset();
        }

        if (modal) modal.style.display = 'flex';
    },

    closeClientModal() {
        const modal = document.getElementById('client-modal');
        if (modal) modal.style.display = 'none';
    },

    async editClient(id) {
        try {
            const docRef = doc(db, "clients", id);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const data = snap.data();
                document.getElementById('client-id').value = id;
                document.getElementById('client-names').value = data.names || '';
                document.getElementById('client-slug').value = data.slug || '';
                document.getElementById('client-date').value = data.date || '';
                document.getElementById('client-venue').value = data.venue || '';
                document.getElementById('client-quote').value = data.quote || '';
                document.getElementById('client-theme').value = data.theme || 'classic-emerald';
                document.getElementById('client-registry').value = data.registry || '';
                document.getElementById('client-accommodation').value = data.accommodation || '';

                this.openClientModal(true);
            }
        } catch (err) {
            console.error("Error loading client:", err);
            showToast("Failed to load event details.", "⚠️");
        }
    },

    async handleClientSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        const id = document.getElementById('client-id').value;
        const data = {
            names: document.getElementById('client-names').value.trim(),
            slug: document.getElementById('client-slug').value.trim().toLowerCase(),
            date: document.getElementById('client-date').value.trim(),
            venue: document.getElementById('client-venue').value.trim(),
            quote: document.getElementById('client-quote').value.trim(),
            theme: document.getElementById('client-theme').value,
            registry: document.getElementById('client-registry').value.trim(),
            accommodation: document.getElementById('client-accommodation').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (id) {
                await setDoc(doc(db, "clients", id), data, { merge: true });
                showToast("Event updated successfully!", "✅");
            } else {
                data.createdAt = new Date().toISOString();
                await addDoc(collection(db, "clients"), data);
                showToast("Event created successfully!", "🎉");
            }
            this.closeClientModal();
        } catch (err) {
            console.error("Error saving client:", err);
            showToast("Failed to save event.", "⚠️");
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    },

    async deleteClient(id) {
        try {
            await deleteDoc(doc(db, "clients", id));
            showToast("Event deleted.", "🗑️");
            this.closeConfirmModal();
        } catch (err) {
            console.error("Error deleting client:", err);
            showToast("Failed to delete event.", "⚠️");
        }
    },

    // RSVPs Management
    async viewRSVPs(id, names) {
        AppState.currentClientId = id;

        const title = document.getElementById('rsvp-view-title');
        if (title) title.innerText = `Guests: ${names}`;

        this.showTab('rsvps');
        this.loadRSVPs(id);
    },

    loadRSVPs(clientId) {
        const rsvpList = document.getElementById('rsvp-list');
        const totalGuests = document.getElementById('total-guests');
        const totalAttending = document.getElementById('total-attending');
        const totalDeclined = document.getElementById('total-declined');

        if (!rsvpList) return;

        const unsubscribe = onSnapshot(
            query(collection(db, "clients", clientId, "rsvps"), orderBy("timestamp", "desc")),
            (snapshot) => {
                rsvpList.innerHTML = '';
                let total = 0, attending = 0, declined = 0;

                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    total++;

                    if (data.attendance === 'attending') {
                        attending += data.guests || 1;
                    } else {
                        declined++;
                    }

                    const card = this.createRSVPCard(docSnap.id, data);
                    rsvpList.appendChild(card);
                });

                if (totalGuests) totalGuests.innerText = total;
                if (totalAttending) totalAttending.innerText = attending;
                if (totalDeclined) totalDeclined.innerText = declined;
            }
        );

        AppState.unsubscribers.push(unsubscribe);
    },

    createRSVPCard(id, data) {
        const card = document.createElement('div');
        card.className = 'client-card';

        const isAttending = data.attendance === 'attending';
        const statusClass = isAttending ? 'status-attending' : 'status-declined';
        const statusText = isAttending ? 'Attending' : 'Declined';

        card.innerHTML = `
            <div class="card-header">
                <h3 class="serif">${this.escapeHtml(data.name)}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="meta-label">Guests</span>
                    <span class="meta-value">${data.guests || 1}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Dietary</span>
                    <span class="meta-value">${this.escapeHtml(data.dietary) || 'None specified'}</span>
                </div>
            </div>
            ${data.message ? `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); font-size: 0.9rem; font-style: italic; border: 1px solid var(--glass-border);">
                    "${this.escapeHtml(data.message)}"
                </div>
            ` : ''}
            <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-dim);">
                Submitted: ${new Date(data.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
            </div>
        `;

        return card;
    },

    async exportRSVPsToCSV() {
        if (!AppState.currentClientId) {
            showToast("Please select an event first.", "⚠️");
            return;
        }

        showToast("Preparing export...", "📊");

        try {
            const rsvpsRef = collection(db, "clients", AppState.currentClientId, "rsvps");
            const snapshot = await getDocs(query(rsvpsRef, orderBy("timestamp", "desc")));

            if (snapshot.empty) {
                showToast("No RSVPs to export.", "📭");
                return;
            }

            let csvContent = "Name,Attendance,Guests,Dietary,Message,Timestamp\n";

            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                const row = [
                    `"${(d.name || '').replace(/"/g, '""')}"`,
                    d.attendance || '',
                    d.guests || 1,
                    `"${(d.dietary || '').replace(/"/g, '""')}"`,
                    `"${(d.message || '').replace(/"/g, '""')}"`,
                    d.timestamp || ''
                ].join(",");
                csvContent += row + "\n";
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `rsvps_${AppState.currentClientId}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast("CSV exported successfully!", "✅");
        } catch (err) {
            console.error("Export error:", err);
            showToast("Export failed. Please try again.", "⚠️");
        }
    },

    // Invites Management
    async viewInvites(id, names, slug) {
        AppState.currentClientId = id;
        AppState.currentClientData = { slug };

        const title = document.getElementById('invite-view-title');
        if (title) title.innerText = `Invites: ${names}`;

        this.showTab('invites');
        this.loadInvites(id);
    },

    loadInvites(clientId) {
        const inviteList = document.getElementById('invite-list');
        if (!inviteList) return;

        const unsubscribe = onSnapshot(
            collection(db, "clients", clientId, "invites"),
            (snapshot) => {
                inviteList.innerHTML = '';

                if (snapshot.empty) {
                    inviteList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">💌</div>
                            <p class="empty-state-text">No invitations yet. Create one to get started!</p>
                        </div>
                    `;
                    return;
                }

                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const card = this.createInviteCard(docSnap.id, data);
                    inviteList.appendChild(card);
                });
            }
        );

        AppState.unsubscribers.push(unsubscribe);
    },

    createInviteCard(id, data) {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="serif">${this.escapeHtml(data.name)}</h3>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">
                        Created: ${new Date(data.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="status-indicator"></div>
            </div>
            
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="meta-label">Access Code</span>
                    <span class="meta-value" style="color: var(--primary); letter-spacing: 0.2em; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">${data.code}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span class="meta-value" style="color: var(--success);">Active</span>
                </div>
            </div>

            <div class="client-actions">
                <button class="btn btn-outline btn-small" data-action="qr" data-code="${data.code}" data-name="${this.escapeHtml(data.name)}">
                    <span>📱</span> QR Code
                </button>
                <button class="btn btn-outline btn-small" data-action="copy" data-code="${data.code}">
                    <span>🔗</span> Copy Link
                </button>
                <button class="btn btn-outline btn-small" data-action="delete" data-id="${id}" style="color: var(--danger); border-color: rgba(231, 76, 60, 0.2);">
                    <span>🗑️</span>
                </button>
            </div>
        `;

        // Add event listeners
        card.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;

                switch (action) {
                    case 'qr':
                        this.showQRCode(e.currentTarget.dataset.code, e.currentTarget.dataset.name);
                        break;
                    case 'copy':
                        this.copyInviteLink(e.currentTarget.dataset.code);
                        break;
                    case 'delete':
                        this.showConfirmModal(
                            'Delete Invitation',
                            'Are you sure you want to delete this invitation? The guest will no longer be able to access the RSVP form.',
                            () => this.deleteInvite(e.currentTarget.dataset.id)
                        );
                        break;
                }
            });
        });

        return card;
    },

    openInviteModal() {
        const modal = document.getElementById('invite-modal');
        document.getElementById('invite-form').reset();
        document.getElementById('invite-id').value = "";
        if (modal) modal.style.display = 'flex';
    },

    closeInviteModal() {
        const modal = document.getElementById('invite-modal');
        if (modal) modal.style.display = 'none';
    },

    async handleInviteSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        const id = document.getElementById('invite-id').value;
        const code = document.getElementById('invite-code').value || this.generateCode();

        const data = {
            name: document.getElementById('invite-name').value.trim(),
            code: code,
            createdAt: new Date().toISOString()
        };

        try {
            if (id) {
                await setDoc(doc(db, "clients", AppState.currentClientId, "invites", id), data, { merge: true });
            } else {
                await addDoc(collection(db, "clients", AppState.currentClientId, "invites"), data);
            }

            showToast("Invitation created!", "💌");
            this.closeInviteModal();
        } catch (err) {
            console.error("Error saving invite:", err);
            showToast("Failed to create invitation.", "⚠️");
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    },

    generateCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    async deleteInvite(id) {
        try {
            await deleteDoc(doc(db, "clients", AppState.currentClientId, "invites", id));
            showToast("Invitation deleted.", "🗑️");
            this.closeConfirmModal();
        } catch (err) {
            console.error("Error deleting invite:", err);
            showToast("Failed to delete invitation.", "⚠️");
        }
    },

    getInviteUrl(code) {
        const slug = AppState.currentClientData?.slug;
        if (!slug) return '';
        return `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?e=${slug}&code=${code}`;
    },

    copyInviteLink(code) {
        const url = this.getInviteUrl(code);
        navigator.clipboard.writeText(url).then(() => {
            showToast("Link copied to clipboard!", "📋");
        }).catch(() => {
            showToast("Failed to copy link.", "⚠️");
        });
    },

    showQRCode(code, name) {
        const modal = document.getElementById('qr-modal');
        const qrDiv = document.getElementById('qrcode');
        const urlInput = document.getElementById('qr-url');
        const label = document.getElementById('qr-label');
        const codeDisplay = document.getElementById('qr-code-display');

        const url = this.getInviteUrl(code);

        if (qrDiv) {
            qrDiv.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrDiv, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }

        if (label) label.innerText = `Invitation for ${name}`;
        if (codeDisplay) codeDisplay.innerText = code;
        if (urlInput) urlInput.value = url;
        if (modal) modal.style.display = 'flex';
    },

    closeQRModal() {
        const modal = document.getElementById('qr-modal');
        if (modal) modal.style.display = 'none';
    },

    // Confirm Dialog
    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('btn-confirm-action');

        if (titleEl) titleEl.innerText = title;
        if (messageEl) messageEl.innerText = message;

        if (confirmBtn) {
            confirmBtn.onclick = onConfirm;
        }

        if (modal) modal.style.display = 'flex';
    },

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.style.display = 'none';
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, CONFIG.toastDuration);
}

function showError(msg) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 400px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p class="serif" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Oops!</p>
                <p style="color: var(--text-muted);">${msg}</p>
            </div>
        `;
    } else {
        alert(msg);
    }
}

function initAnimations() {
    if (typeof gsap === 'undefined') return;

    const mainContent = document.getElementById('main-content');
    const loader = document.getElementById('loader');

    if (mainContent) {
        mainContent.style.display = 'block';
    }

    const tl = gsap.timeline();

    // Loader animation
    if (loader) {
        tl.to(".loader-logo", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
            .to(".loader-line", { width: "200px", duration: 1, ease: "power2.inOut" })
            .to(loader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    loader.style.display = 'none';
                }
            }, "+=0.3");
    }

    // Content fade in
    if (mainContent) {
        tl.to(mainContent, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.3");
    }

    // Hero elements stagger
    tl.from(".hero-content .fade-up", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out"
    }, "-=0.3");

    // Scroll-triggered animations
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray(".fade-up").forEach(el => {
            if (!el.closest('.hero-content')) {
                gsap.to(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out"
                });
            }
        });
    }
}

function initCursor() {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower || typeof gsap === 'undefined') return;

    // Check for touch device
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
        return;
    }

    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0 });
        gsap.to(follower, { x: mouseX, y: mouseY, duration: 0.15, ease: "power2.out" });
    });

    // Hover effects
    const hoverables = document.querySelectorAll('button, a, input, select, textarea, .client-card, [role="button"]');

    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            follower.classList.add('cursor-hover');
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            follower.classList.remove('cursor-hover');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        follower.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
    });
}

// Expose necessary functions globally for any inline handlers
window.showToast = showToast;
