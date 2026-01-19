import { db, auth, provider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, where, getDocs, getDoc } from './firebase-config.js';

// Configuration
const ADMIN_EMAIL = "isaacjana.h@gmail.com";
let currentClientId = null;
let currentClientData = null;

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('e');
    const isAdmin = urlParams.has('admin');

    if (isAdmin) {
        initAdminView();
    } else if (eventSlug) {
        loadEvent(eventSlug);
    } else {
        showError("Invalid Invitation Link. Please check your URL.");
    }
});

// --- CLIENT LANDING LOGIC ---

async function loadEvent(slug) {
    const q = query(collection(db, "clients"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        showError("Invitation not found.");
        return;
    }

    const clientDoc = querySnapshot.docs[0];
    currentClientId = clientDoc.id;
    currentClientData = clientDoc.data();

    updateUIWithClientData(currentClientData);
    initAnimations();
    initRSVP();
    startCountdown(currentClientData.date);
}

function updateUIWithClientData(data) {
    document.title = `${data.names} | Wedding Invitation`;
    document.getElementById('display-names').innerText = data.names;
    document.getElementById('display-date').innerText = data.date;
    document.getElementById('display-venue').innerText = data.venue;
    document.getElementById('display-quote').innerText = data.quote || "";

    // Registry & Accommodation Displays
    const registrySec = document.getElementById('registry-section');
    const registryLink = document.getElementById('display-registry');
    if (data.registry) {
        registrySec.style.display = 'block';
        registryLink.href = data.registry;
    } else {
        registrySec.style.display = 'none';
    }

    const accomSec = document.getElementById('accommodation-section');
    const accomText = document.getElementById('display-accommodation');
    if (data.accommodation) {
        accomSec.style.display = 'block';
        accomText.innerText = data.accommodation;
    } else {
        accomSec.style.display = 'none';
    }

    // Apply Theme
    if (data.theme) {
        document.body.className = `theme-${data.theme}`;
    }

    // Calendar Link (Simplified Google Calendar Link)
    const calBtn = document.createElement('a');
    calBtn.className = 'calendar-btn fade-up';
    calBtn.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=Wedding:+${encodeURIComponent(data.names)}&details=We+look+forward+to+seeing+you!&location=${encodeURIComponent(data.venue)}`;
    calBtn.target = '_blank';
    calBtn.innerHTML = `<span>📅 Add to Calendar</span>`;
    document.getElementById('display-venue').after(calBtn);

    // Initials for footer/loader
    const initials = data.names.split('&').map(s => s.trim()[0]).join(' & ');
    document.getElementById('display-initials').innerText = initials;
    document.getElementById('loader-initials').innerText = initials;
}

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
    document.getElementById('loader').style.display = 'none';
    document.getElementById('admin-view').style.display = 'block';
    document.getElementById('main-content').style.opacity = '1';
    document.getElementById('main-content').style.display = 'block';

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
    document.getElementById('btn-back-to-clients').onclick = () => showTab('clients');
    document.getElementById('btn-export-csv').onclick = exportRSVPsToCSV;
}

async function loadClients() {
    const clientList = document.getElementById('client-list');
    onSnapshot(collection(db, "clients"), (snapshot) => {
        clientList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'guest-card client-card';
            card.innerHTML = `
                <h3 class="serif">${data.names}</h3>
                <p style="font-size: 0.8rem; opacity: 0.7;">Slug: ${data.slug}</p>
                <div class="client-actions">
                    <button class="btn-small" onclick="viewRSVPs('${doc.id}', '${data.names}')">View RSVPs</button>
                    <button class="btn-small" onclick="editClient('${doc.id}')">Edit</button>
                    <button class="btn-small" style="color: #e74c3c; border-color: #e74c3c;" onclick="deleteClient('${doc.id}')">Delete</button>
                    <a href="?e=${data.slug}" target="_blank" class="btn-small" style="text-decoration:none;">Open Link</a>
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
            card.className = 'guest-card';
            card.innerHTML = `
                <span class="status-badge ${data.attendance === 'attending' ? 'status-attending' : 'status-declined'}">${data.attendance}</span>
                <h3 class="serif">${data.name}</h3>
                <p>Guests: ${data.guests}</p>
                <p style="font-size:0.75rem; opacity:0.6;">${data.dietary || 'No dietary requirements'}</p>
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
    document.getElementById('view-clients').style.display = tab === 'clients' ? 'block' : 'none';
    document.getElementById('view-rsvps').style.display = tab === 'rsvps' ? 'block' : 'none';
    document.getElementById('nav-clients').classList.toggle('active', tab === 'clients');
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
    document.getElementById('loader').innerHTML = `<div class="serif" style="color:var(--primary); text-align:center; padding:2rem;">${msg}</div>`;
}

function initAnimations() {
    document.getElementById('main-content').style.display = 'block';
    const tl = gsap.timeline();
    tl.to(".loader-logo", { opacity: 1, y: 0, duration: 1 })
        .to(".loader-line", { width: "200px", duration: 1.5 }, "-=0.5")
        .to("#loader", { opacity: 0, duration: 1, pointerEvents: "none" }, "+=0.5")
        .to("#main-content", { opacity: 1, duration: 1 }, "-=0.5")
        .from(".hero-content", { y: 50, opacity: 0, duration: 1.5 }, "-=0.5");

    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".fade-up").forEach(el => {
        gsap.to(el, { scrollTrigger: { trigger: el, start: "top 85%" }, opacity: 1, y: 0, duration: 1 });
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
