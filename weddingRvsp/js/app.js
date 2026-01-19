import { db, auth, provider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, onSnapshot, query, orderBy } from './firebase-config.js';

window.addEventListener('load', () => {
    initAnimations();
    initRSVP();
    checkAdminMode();
});

// Authorized Email
const ADMIN_EMAIL = "isaacjana.h@gmail.com";

// 1. Entrance Animations
function initAnimations() {
    const tl = gsap.timeline();

    tl.to(".loader-logo", { opacity: 1, y: 0, duration: 1, ease: "power4.out" })
        .to(".loader-line", { width: "200px", duration: 1.5, ease: "power4.inOut" }, "-=0.5")
        .to("#loader", { opacity: 0, duration: 1, pointerEvents: "none", ease: "power2.inOut" }, "+=0.5")
        .to("#main-content", { opacity: 1, duration: 1 }, "-=0.5")
        .from(".hero-content", { y: 100, opacity: 0, duration: 1.5, ease: "expo.out" }, "-=0.5")
        .from(".names", { letterSpacing: "1rem", duration: 2, ease: "expo.out" }, "-=1.5");

    // Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".fade-up").forEach(el => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none none"
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out"
        });
    });
}

// 2. RSVP Logic
function initRSVP() {
    const rsvpForm = document.getElementById('rsvp-form');
    if (!rsvpForm) return;

    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = rsvpForm.querySelector('button');
        const originalText = btn.innerText;
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
            await addDoc(collection(db, "rsvp"), formData);

            // Success Feedback
            gsap.to(".rsvp-card", {
                opacity: 0,
                y: -50,
                duration: 0.8,
                onComplete: () => {
                    document.querySelector('.rsvp-card').innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <h2 class="serif" style="color: var(--primary); font-size: 2.5rem;">Thank You!</h2>
                            <p style="margin-top: 1rem;">We have received your response for ${formData.name}.</p>
                            <p style="margin-top: 2rem;">See you in Singapore!</p>
                        </div>
                    `;
                    gsap.to(".rsvp-card", { opacity: 1, y: 0, duration: 0.8 });
                }
            });
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Oops! Something went wrong. Please try again.");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

// 3. Admin Dashboard & Auth
function checkAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        document.getElementById('home').style.display = 'none';
        document.querySelector('.rsvp-section').style.display = 'none';
        document.getElementById('main-content').style.opacity = '1';

        initAdminAuth();
    }
}

function initAdminAuth() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginSection = document.getElementById('admin-login-section');
    const adminContent = document.getElementById('admin-content');

    loginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Please use a Google account.");
        }
    });

    logoutBtn.addEventListener('click', () => signOut(auth));

    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            loginSection.style.display = 'none';
            adminContent.style.display = 'block';
            loadRSVPs();
        } else {
            if (user) {
                alert("Unauthorized. Please login with " + ADMIN_EMAIL);
                signOut(auth);
            }
            loginSection.style.display = 'block';
            adminContent.style.display = 'none';
        }
    });
}

function loadRSVPs() {
    const rsvpList = document.getElementById('rsvp-list');
    const totalGuestsEl = document.getElementById('total-guests');
    const totalAttendingEl = document.getElementById('total-attending');

    const q = query(collection(db, "rsvp"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        rsvpList.innerHTML = '';
        let total = 0;
        let attending = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'guest-card fade-up';
            card.style.opacity = 1;
            card.style.transform = 'none';

            const statusClass = data.attendance === 'attending' ? 'status-attending' : 'status-declined';

            card.innerHTML = `
                <span class="status-badge ${statusClass}">${data.attendance}</span>
                <h3 class="serif">${data.name}</h3>
                <p>Guests: ${data.guests}</p>
                <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.7;">Dietary: ${data.dietary || 'None'}</p>
                <p style="margin-top: 5px; font-size: 0.6rem; opacity: 0.5;">${new Date(data.timestamp).toLocaleString()}</p>
            `;
            rsvpList.appendChild(card);

            total += 1;
            if (data.attendance === 'attending') {
                attending += data.guests;
            }
        });

        totalGuestsEl.innerText = total;
        totalAttendingEl.innerText = attending;
    }, (error) => {
        console.error("Firestore Listen Error:", error);
        if (error.code === 'permission-denied') {
            alert("Permission denied. Ensure your Firestore rules are updated.");
        }
    });
}
