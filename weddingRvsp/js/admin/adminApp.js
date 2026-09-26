import { db, collection, addDoc, getDocs, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc } from '../services/firebaseService.js';
import { setupAuthListener, loginWithGoogle, logout, AppState as AuthState } from '../services/authService.js';
import { showToast } from '../components/ui.js';

const AdminState = {
    currentClientId: null,
    currentClientData: null,
    unsubscribers: []
};

const AdminApp = {
    init() {
        this.hideLoader();
        this.showAdminView();
        
        setupAuthListener(
            (user) => {
                const loginSection = document.getElementById('admin-login-section');
                const contentSection = document.getElementById('admin-content');
                const userInfo = document.getElementById('user-info');
                const userEmail = document.getElementById('user-email');

                if (loginSection) loginSection.style.display = 'none';
                if (contentSection) contentSection.style.display = 'contents';

                // Show user info
                if (userInfo) userInfo.style.display = 'flex';
                if (userEmail) userEmail.innerText = user.email;

                this.loadClients();
            },
            () => {
                const loginSection = document.getElementById('admin-login-section');
                const contentSection = document.getElementById('admin-content');
                
                if (loginSection) loginSection.style.display = 'flex';
                if (contentSection) contentSection.style.display = 'none';
            }
        );

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

    setupEventListeners() {
        // Auth buttons
        document.getElementById('login-btn')?.addEventListener('click', loginWithGoogle);
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.cleanup();
            logout();
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
        AdminState.unsubscribers.forEach(unsub => unsub());
        AdminState.unsubscribers = [];
        AdminState.currentClientId = null;
        AdminState.currentClientData = null;
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
                    el.style.display = AdminState.currentClientId ? 'flex' : 'none';
                }
            }
        });

        // Reset to dashboard clears selected client
        if (tab === 'clients') {
            AdminState.currentClientId = null;
            AdminState.currentClientData = null;
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

        AdminState.unsubscribers.push(unsubscribe);
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
        AdminState.currentClientId = id;

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

        AdminState.unsubscribers.push(unsubscribe);
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
        if (!AdminState.currentClientId) {
            showToast("Please select an event first.", "⚠️");
            return;
        }

        showToast("Preparing export...", "📊");

        try {
            const rsvpsRef = collection(db, "clients", AdminState.currentClientId, "rsvps");
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
            link.download = `rsvps_${AdminState.currentClientId}_${new Date().toISOString().split('T')[0]}.csv`;
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
        AdminState.currentClientId = id;
        AdminState.currentClientData = { slug };

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

        AdminState.unsubscribers.push(unsubscribe);
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
                await setDoc(doc(db, "clients", AdminState.currentClientId, "invites", id), data, { merge: true });
            } else {
                await addDoc(collection(db, "clients", AdminState.currentClientId, "invites"), data);
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
            await deleteDoc(doc(db, "clients", AdminState.currentClientId, "invites", id));
            showToast("Invitation deleted.", "🗑️");
            this.closeConfirmModal();
        } catch (err) {
            console.error("Error deleting invite:", err);
            showToast("Failed to delete invitation.", "⚠️");
        }
    },

    getInviteUrl(code) {
        const slug = AdminState.currentClientData?.slug;
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

window.addEventListener('load', () => {
    AdminApp.init();
});
