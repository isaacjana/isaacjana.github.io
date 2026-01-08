import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp, enableIndexedDbPersistence, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCk6mub0hDCzJ5iDmV-61v3WLSHMC51JP4",
    authDomain: "munch-24119.firebaseapp.com",
    projectId: "munch-24119",
    storageBucket: "munch-24119.firebasestorage.app",
    messagingSenderId: "834099093086",
    appId: "1:834099093086:web:4625eb29879ab30317decf",
    measurementId: "G-4JL4YL6SHF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

enableIndexedDbPersistence(db).catch(() => {});

let currentUser = null;
const todayStr = () => new Date().toISOString().split('T')[0];

$('.nav-item').click(function() {
    const target = $(this).data('target');
    $('.view-section').removeClass('active');
    $(`#view-${target}`).addClass('active');
    $('.nav-item').removeClass('text-emerald-500').addClass('text-gray-500');
    $(this).addClass('text-emerald-500').removeClass('text-gray-500');
});

$('#login-btn').click(() => signInWithPopup(auth, provider));
$('#logout-btn').click(() => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').fadeOut();
        $('#app').removeClass('hidden');
        $('#user-name').text(user.displayName.split(' ')[0]);
        // Delay to ensure auth state is propagated to Firestore rules
        setTimeout(() => { initRealtimeUpdates(); }, 600);
    } else {
        $('#auth-overlay').fadeIn();
        $('#app').addClass('hidden');
    }
});

$('#meal-form').submit(async (e) => {
    e.preventDefault();
    const payload = {
        uid: currentUser.uid,
        mealType: $('#mealType').val(),
        description: $('#description').val(),
        nutrients: $('#nutrients').val().split(',').map(t => t.trim()).filter(t => t !== ""),
        createdAt: serverTimestamp(),
        dateStr: todayStr()
    };
    try {
        await addDoc(collection(db, "meals"), payload);
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        $('#meal-modal').fadeOut();
        $('#meal-form')[0].reset();
    } catch (err) { console.error("Write error:", err); }
});

$('#open-modal').click(() => $('#meal-modal').fadeIn().css('display', 'flex'));
$('#close-modal').click(() => $('#meal-modal').fadeOut());

function initRealtimeUpdates() {
    // Requires Composite Index: uid (Asc), createdAt (Desc)
    const q = query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        let dailyCount = 0;
        const history = {};
        let listHtml = '';
        snapshot.forEach((docSnap) => {
            const meal = docSnap.data();
            if (meal.dateStr === todayStr()) { dailyCount++; listHtml += renderMealCard(docSnap.id, meal); }
            if (!history[meal.dateStr]) history[meal.dateStr] = 0;
            history[meal.dateStr]++;
        });
        $('#meal-list').html(listHtml);
        $('#daily-count').text(dailyCount);
        calculateStreak(history);
        handleCalendarView(snapshot.docs);
    }, (error) => {
        if(error.code === 'permission-denied') {
            console.warn("Retrying listener... Index may be building.");
            setTimeout(initRealtimeUpdates, 3000);
        }
    });
}

function renderMealCard(id, meal) {
    return `<div class="glass p-5 rounded-2xl flex justify-between items-center">
        <div><span class="text-[9px] font-black uppercase text-emerald-500">${meal.mealType}</span><h4 class="font-bold text-lg">${meal.description}</h4></div>
        <button onclick="deleteMeal('${id}')" class="text-gray-700 hover:text-red-400 p-2">✕</button>
    </div>`;
}

window.deleteMeal = async (id) => { if (confirm("Delete?")) await deleteDoc(doc(db, "meals", id)); };

function calculateStreak(history) {
    let streak = 0; let d = new Date();
    while (history[d.toISOString().split('T')[0]] >= 3) { streak++; d.setDate(d.getDate() - 1); }
    $('#streak-count').text(streak);
}

function handleCalendarView(docs) {
    $('#date-filter').off('change').on('change', function() {
        const selected = $(this).val();
        let html = '';
        docs.forEach(d => { if (d.data().dateStr === selected) html += renderMealCard(d.id, d.data()); });
        $('#calendar-results').html(html || '<p class="text-center py-10 text-gray-600">No logs found.</p>');
    });
}

// Debug Utility: Clean orphaned records (No UID)
window.cleanOrphanedLogs = async () => {
    const q = query(collection(db, "meals"), where("uid", "==", null));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log("Cleanup complete.");
};

if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js')); }
