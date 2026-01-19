import { db, auth, provider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, where, getDocs, getDoc } from './firebase-config.js';

// Configuration
const ADMIN_EMAIL = "isaacjana.h@gmail.com";
let currentClientId = null;
let currentClientData = null;

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('e');
    const isAdminRequested = urlParams.has('admin');

    if (window.isAdminPage || isAdminRequested) {
        if (!window.isAdminPage) {
            window.location.href = `admin.html${window.location.search}`;
            return;
        }
        initAdminView();
    } else if (eventSlug) {
        initCursor();
        WeddingApp.init();
    } else {
        showError("Invalid link. Please check your invitation.");
    }
});

// --- CLIENT LANDING EXPERIENCE ---

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

            const doc = snap.docs[0];
            currentClientId = doc.id;
            currentClientData = doc.data();

            this.setupUI();
            this.handleGuestEntrance();
        } catch (err) {
            console.error(err);
            showError("Unable to connect to service. Please try again later.");
        }
    },

    setupUI() {
        const data = currentClientData;
        document.title = `${data.names} | Wedding Invitation`;

        // Populate core text
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val || "";
        };

        setTxt('display-names', data.names);
        setTxt('display-date', data.date);
        setTxt('display-venue', data.venue);
        setTxt('display-quote', data.quote);
        setTxt('venue-details', `Our celebration will be held at ${data.venue}.`);
        setTxt('venue-address', data.venue);

        // Registry & Accommodation
        const toggleSection = (id, condition, val) => {
            const sec = document.getElementById(id);
            if (!sec) return;
            sec.style.display = condition ? 'block' : 'none';
            if (condition && val) {
                const sub = sec.querySelector('[id^="display-"]');
                if (sub) sub.innerText = val;
                if (sub && sub.tagName === 'A') sub.href = val;
            }
        };

        toggleSection('registry-section', !!data.registry, data.registry);
        toggleSection('accommodation-section', !!data.accommodation, data.accommodation);

        // Initials Logic
        const initials = data.names.split('&').map(s => s.trim()[0]).join(' & ');
        setTxt('display-initials', initials);
        const lLogo = document.querySelector('.loader-logo');
        if (lLogo) lLogo.innerText = initials;

        // Theme
        if (data.theme) document.body.className = `theme-${data.theme}`;

        // Feature Inits
        startCountdown(data.date);
        initMaps(data.venue);
    },

    handleGuestEntrance() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const sessionAuth = sessionStorage.getItem(`auth_${currentClientId}`);

        if (code) {
            this.verifyGuest(code);
        } else if (sessionAuth) {
            this.unlockInvite();
        } else {
            // Show auth section
            const authSec = document.getElementById('guest-auth');
            if (authSec) authSec.style.display = 'block';

            const vBtn = document.getElementById('btn-verify');
            if (vBtn) {
                vBtn.onclick = () => {
                    const codeInput = document.getElementById('auth-code').value;
                    this.verifyGuest(codeInput);
                };
            }
        }
    },

    async verifyGuest(code) {
        if (!code || code.length < 4) return;

        try {
            const q = query(collection(db, "clients", currentClientId, "invites"), where("code", "==", code));
            const snap = await getDocs(q);

            if (!snap.empty) {
                sessionStorage.setItem(`auth_${currentClientId}`, "true");
                this.unlockInvite();
            } else {
                showToast("Invalid code. Please try again.", "🔒");
                const input = document.getElementById('auth-code');
                if (input) {
                    gsap.to(input, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
                }
            }
        } catch (err) {
            showToast("Connection error. Try again.", "⚠️");
        }
    },

    unlockInvite() {
        gsap.to("#guest-auth", {
            opacity: 0, scale: 0.9, duration: 0.8, onComplete: () => {
                const authSec = document.getElementById('guest-auth');
                if (authSec) authSec.style.display = 'none';

                const rsvpForm = document.getElementById('rsvp-form');
                if (rsvpForm) rsvpForm.style.display = 'block';

                initAnimations();
                initRSVP();
            }
        });
    }
};

// --- UTILITIES ---

function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 1000);
    }, 4000);
}

function startCountdown(dateStr) {
    const targetDate = new Date(dateStr).getTime();
    if (isNaN(targetDate)) return;

    const update = () => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff < 0) {
            document.getElementById('countdown').style.display = 'none';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById('days').innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('mins').innerText = mins.toString().padStart(2, '0');
    };

    update();
    setInterval(update, 60000);
}

function initRSVP() {
    const rsvpForm = document.getElementById('rsvp-form');
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = rsvpForm.querySelector('button');
        btn.innerText = "Sending...";
        btn.disabled = true;

        const formData = {
            name: document.getElementById('guest-name').value,
            attendance: document.getElementById('attendance').value,
            guests: parseInt(document.getElementById('guest-count').value),
            dietary: document.getElementById('dietary').value,
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "clients", currentClientId, "rsvps"), formData);
            showToast("RSVP Confirmed! Thank you.", "🥂");

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d4af37', '#f8f1e5', '#0a1f1a']
            });

            gsap.to(".rsvp-card", {
                opacity: 0, y: -50, duration: 0.8,
                onComplete: () => {
                    document.querySelector('.rsvp-card').innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <h2 class="serif" style="color: var(--primary); font-size: 2.5rem;">Thank You!</h2>
                            <p style="margin-top: 1rem;">We've received your response, ${formData.name.split(' ')[0]}.</p>
                        </div>`;
                    gsap.to(".rsvp-card", { opacity: 1, y: 0, duration: 0.8 });
                }
            });
        } catch (e) {
            showToast("Failed to send RSVP.", "⚠️");
            btn.innerText = "Confirm Attendance";
            btn.disabled = false;
        }
    });
}

// --- ADMIN DASHBOARD LOGIC ---

function initAdminView() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    const adminView = document.getElementById('admin-view');
    if (adminView) adminView.style.display = 'block';

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.style.display = 'block';
    }

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    loginBtn.addEventListener('click', () => signInWithPopup(auth, provider));
    logoutBtn.addEventListener('click', () => signOut(auth));

    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            document.getElementById('admin-login-section').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            loadClients();
        } else {
            if (user) { alert("Unauthorized access."); signOut(auth); }
            document.getElementById('admin-login-section').style.display = 'block';
            document.getElementById('admin-content').style.display = 'none';
        }
    });

    initAdminEvents();
}

function initAdminEvents() {
    document.getElementById('btn-add-client').onclick = () => openClientModal();
    document.getElementById('btn-close-modal').onclick = () => closeClientModal();
    document.getElementById('client-form').onsubmit = handleClientSubmit;
    document.getElementById('nav-clients').onclick = () => showTab('clients');
    document.getElementById('nav-invites').onclick = () => showTab('invites');
    document.getElementById('nav-rsvps').onclick = () => showTab('rsvps');
    document.getElementById('btn-back-to-clients').onclick = () => showTab('clients');
    document.getElementById('btn-back-to-clients-from-invites').onclick = () => showTab('clients');
    document.getElementById('btn-add-invite').onclick = () => openInviteModal();
    document.getElementById('btn-close-invite-modal').onclick = () => closeInviteModal();
    document.getElementById('invite-form').onsubmit = handleInviteSubmit;

    document.getElementById('btn-export-csv').onclick = exportRSVPsToCSV;

    // Search Filtering
    document.getElementById('client-search').oninput = (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.client-card').forEach(card => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(term) ? 'block' : 'none';
        });
    };
}

async function loadClients() {
    const clientList = document.getElementById('client-list');
    onSnapshot(collection(db, "clients"), (snapshot) => {
        clientList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = data.date.split(',')[1] || data.date;

            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <h3 class="serif">${data.names}</h3>
                        <div class="slug">/${data.slug}</div>
                    </div>
                    <div class="status-indicator"></div>
                </div>
                
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Event Date</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Design Theme</span>
                        <span class="meta-value">${data.theme || 'Premium Default'}</span>
                    </div>
                </div>

                <div class="client-actions">
                    <button class="btn btn-outline btn-small" onclick="viewRSVPs('${doc.id}', '${data.names}')">
                        <span>👥</span> Guests
                    </button>
                    <button class="btn btn-outline btn-small" onclick="viewInvites('${doc.id}', '${data.names}')">
                        <span>💌</span> Invites
                    </button>
                    <button class="btn btn-outline btn-small" onclick="editClient('${doc.id}')">
                        <span>✍️</span> Edit
                    </button>
                    <a href="?e=${data.slug}" target="_blank" class="btn btn-outline btn-small">
                        <span>🔗</span> View
                    </a>
                    <button class="btn btn-outline btn-small" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.2);" onclick="deleteClient('${doc.id}')">
                        <span>🗑️</span>
                    </button>
                </div>
            `;
            clientList.appendChild(card);
        });
    });
}

// Global scope helpers for onclick (browser-side)
window.viewRSVPs = async (id, names) => {
    currentClientId = id;
    document.getElementById('rsvp-view-title').innerText = `RSVPs: ${names}`;
    showTab('rsvps');
    loadRSVPsForClient(id);
};

window.viewInvites = async (id, names) => {
    currentClientId = id;
    document.getElementById('invite-view-title').innerText = `Invites: ${names}`;
    showTab('invites');
    loadInvitesForClient(id);
};

window.editClient = async (id) => {
    const docRef = doc(db, "clients", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        document.getElementById('client-id').value = id;
        document.getElementById('client-names').value = data.names;
        document.getElementById('client-slug').value = data.slug;
        document.getElementById('client-date').value = data.date;
        document.getElementById('client-venue').value = data.venue;
        document.getElementById('client-quote').value = data.quote || "";
        document.getElementById('client-theme').value = data.theme || "classic-emerald";
        document.getElementById('client-registry').value = data.registry || "";
        document.getElementById('client-accommodation').value = data.accommodation || "";
        openClientModal(true);
    }
};

window.deleteClient = async (id) => {
    if (confirm("Are you sure? This will delete the client invitation.")) {
        await deleteDoc(doc(db, "clients", id));
    }
};

async function handleClientSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('client-id').value;
    const data = {
        names: document.getElementById('client-names').value,
        slug: document.getElementById('client-slug').value,
        date: document.getElementById('client-date').value,
        venue: document.getElementById('client-venue').value,
        quote: document.getElementById('client-quote').value,
        theme: document.getElementById('client-theme').value,
        registry: document.getElementById('client-registry').value,
        accommodation: document.getElementById('client-accommodation').value
    };

    if (id) {
        await setDoc(doc(db, "clients", id), data, { merge: true });
    } else {
        await addDoc(collection(db, "clients"), data);
    }
    closeClientModal();
}

function loadRSVPsForClient(id) {
    const rsvpList = document.getElementById('rsvp-list');
    const totalGuestsEl = document.getElementById('total-guests');
    const totalAttendingEl = document.getElementById('total-attending');

    onSnapshot(query(collection(db, "clients", id, "rsvps"), orderBy("timestamp", "desc")), (snapshot) => {
        rsvpList.innerHTML = '';
        let total = 0, attending = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="serif">${data.name}</h3>
                    <div class="status-badge ${data.attendance === 'attending' ? 'status-attending' : 'status-declined'}" 
                         style="padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: ${data.attendance === 'attending' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; color: ${data.attendance === 'attending' ? '#2ecc71' : '#e74c3c'}; border: 1px solid ${data.attendance === 'attending' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'};">
                        ${data.attendance}
                    </div>
                </div>
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Guests</span>
                        <span class="meta-value">${data.guests}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Dietary</span>
                        <span class="meta-value">${data.dietary || 'None'}</span>
                    </div>
                </div>
                ${data.message ? `<div style="margin-top: 1rem; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); font-size: 0.85rem; font-style: italic; border: 1px solid var(--glass-border);">"${data.message}"</div>` : ''}
            `;
            rsvpList.appendChild(card);
            total++;
            if (data.attendance === 'attending') attending += data.guests;
        });
        totalGuestsEl.innerText = total;
        totalAttendingEl.innerText = attending;
    });
}

// --- UTILITIES ---

function showTab(tab) {
    const views = ['view-clients', 'view-rsvps', 'view-invites'];
    views.forEach(v => document.getElementById(v).style.display = 'none');
    document.getElementById(`view-${tab}`).style.display = 'block';

    const navs = ['nav-clients', 'nav-rsvps', 'nav-invites'];
    navs.forEach(n => {
        const el = document.getElementById(n);
        el.classList.toggle('active', n === `nav-${tab}`);
        // Only show Invitations and Guest List if a client is selected
        if (n !== 'nav-clients') {
            el.style.display = currentClientId ? 'flex' : 'none';
        }
    });
}

function openClientModal(isEdit = false) {
    document.getElementById('modal-title').innerText = isEdit ? "Edit Client" : "New Client";
    if (!isEdit) {
        document.getElementById('client-id').value = "";
        document.getElementById('client-form').reset();
    }
    document.getElementById('client-modal').style.display = 'block';
}

function closeClientModal() {
    document.getElementById('client-modal').style.display = 'none';
}

function showError(msg) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `<div class="serif" style="color:var(--primary); text-align:center; padding:2rem;">${msg}</div>`;
    } else {
        alert(msg);
    }
}

function initAnimations() {
    const mainContent = document.getElementById('main-content');
    const loader = document.getElementById('loader');

    if (mainContent) {
        mainContent.style.display = 'block';
    }

    const tl = gsap.timeline();

    // Loader Out
    if (loader) {
        tl.to(".loader-logo", { opacity: 1, y: 0, duration: 1 })
            .to(".loader-line", { width: "200px", duration: 1 })
            .to(loader, { opacity: 0, duration: 1, pointerEvents: "none", ease: "power4.inOut" }, "+=0.5");
    }

    // Main Content In
    if (mainContent) {
        tl.to(mainContent, { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.5");
    }

    // Hero Stagger
    tl.from(".hero-content .fade-up", {
        y: 50,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "power3.out"
    }, "-=0.5");

    // Scroll Animations
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".fade-up").forEach(el => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none"
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out"
        });
    });
}

async function exportRSVPsToCSV() {
    if (!currentClientId) return;

    showToast("Preparing CSV...", "📊");

    const rsvpsRef = collection(db, "clients", currentClientId, "rsvps");
    const snapshot = await getDocs(query(rsvpsRef, orderBy("timestamp", "desc")));

    if (snapshot.empty) {
        showToast("No RSVPs to export.", "⚠️");
        return;
    }

    let csvContent = "Name,Attendance,Guests,Dietary,Timestamp\n";

    snapshot.forEach(doc => {
        const d = doc.data();
        const row = [
            `"${d.name}"`,
            d.attendance,
            d.guests,
            `"${(d.dietary || '').replace(/"/g, '""')}"`,
            d.timestamp
        ].join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rsvps_${currentClientId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("CSV Downloaded!", "✅");
}

// --- NEW INVITE & MAPS LOGIC ---

function initMaps(venue) {
    const mapContainer = document.getElementById('map-container');
    const iframe = document.createElement('iframe');
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "0";
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=${encodeURIComponent(venue)}`;
    // Note: User needs to provide an API key for Embed API, or we use a simple search link:
    iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(venue)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    mapContainer.appendChild(iframe);
}

function openInviteModal(isEdit = false) {
    document.getElementById('invite-modal').style.display = 'block';
    if (!isEdit) {
        document.getElementById('invite-form').reset();
        document.getElementById('invite-id').value = "";
    }
}

function closeInviteModal() {
    document.getElementById('invite-modal').style.display = 'none';
}

async function handleInviteSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('invite-id').value;
    const code = document.getElementById('invite-code').value || Math.floor(1000 + Math.random() * 9000).toString();

    const data = {
        name: document.getElementById('invite-name').value,
        code: code,
        createdAt: new Date().toISOString()
    };

    if (id) {
        await setDoc(doc(db, "clients", currentClientId, "invites", id), data, { merge: true });
    } else {
        await addDoc(collection(db, "clients", currentClientId, "invites"), data);
    }
    closeInviteModal();
}

async function loadInvitesForClient(clientId) {
    const inviteList = document.getElementById('invite-list');
    onSnapshot(collection(db, "clients", clientId, "invites"), (snapshot) => {
        inviteList.innerHTML = '';
        snapshot.forEach(d => {
            const data = d.data();
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="serif">${data.name}</h3>
                    <div class="status-indicator"></div>
                </div>
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Access Code</span>
                        <span class="meta-value" style="color: var(--primary); letter-spacing: 3px; font-weight: 700;">${data.code}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${new Date(data.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="client-actions">
                    <button class="btn btn-outline btn-small" onclick="generateQR('${data.code}', '${data.name}')">
                        <span>📱</span> QR Code
                    </button>
                    <button class="btn btn-outline btn-small" onclick="copyInviteLink('${data.code}')">
                        <span>🔗</span> Copy Link
                    </button>
                    <button class="btn btn-outline btn-small" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.2);" onclick="deleteInvite('${d.id}')">
                        🗑️
                    </button>
                </div>
            `;
            inviteList.appendChild(card);
        });
    });
}

window.copyInviteLink = (code) => {
    const url = `${window.location.origin}${window.location.pathname}?e=${currentClientData.slug}&code=${code}`;
    navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard", "🔗");
};

window.generateQR = (code, name) => {
    const url = `${window.location.origin}${window.location.pathname}?e=${currentClientData.slug}&code=${code}`;
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
        text: url,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qr-label').innerText = `Invitation for ${name}`;
    document.getElementById('qr-modal').style.display = 'flex';
};

window.deleteInvite = async (id) => {
    if (confirm("Permanently delete this invitation?")) {
        await deleteDoc(doc(db, "clients", currentClientId, "invites", id));
        showToast("Invitation deleted", "🗑️");
    }
};

function initCursor() {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (!cursor || !follower) return;

    window.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0, ease: "none" });
        gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
    });

    const hoverables = document.querySelectorAll('button, a, input, select, textarea, .client-card');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(follower, { scale: 1.5, background: "rgba(var(--primary-rgb), 0.1)", duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(follower, { scale: 1, background: "rgba(var(--primary-rgb), 0.05)", duration: 0.3 });
        });
    });
}
