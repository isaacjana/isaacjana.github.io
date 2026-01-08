import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
let userRecipes = [];
let historyLogs = [];

// Theme Logic
const setDark = (isDark) => {
    if (isDark) { $('html').addClass('dark'); } else { $('html').removeClass('dark'); }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};
$('#dark-mode-toggle').click(() => setDark(!$('html').hasClass('dark')));
setDark(localStorage.getItem('theme') !== 'light');

// Navigation
$('.nav-item').click(function() {
    $('.view-section').removeClass('active');
    $(`#view-${$(this).data('target')}`).addClass('active');
    $('.nav-item').removeClass('text-emerald-500').addClass('text-gray-500');
    $(this).addClass('text-emerald-500');
});

// Auth
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').hide();
        $('#app').removeClass('hidden');
        initListeners();
    } else { $('#auth-overlay').show(); }
});
$('#login-btn').click(() => signInWithPopup(auth, provider));

function initListeners() {
    onSnapshot(query(collection(db, "recipes"), where("uid", "==", currentUser.uid)), (snap) => {
        userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();
        runAnalysis();
    });

    onSnapshot(query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc")), (snap) => {
        historyLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDashboard();
        renderHistory();
        runAnalysis();
    });
}

async function quickLog(name) {
    await addDoc(collection(db, "meals"), {
        uid: currentUser.uid,
        description: name,
        createdAt: serverTimestamp(),
        dateStr: new Date().toISOString().split('T')[0]
    });
    window.navigator.vibrate?.(10);
    $('#modal-container').fadeOut();
}

function runAnalysis() {
    if (userRecipes.length === 0) {
        $('#suggested-meal-name').text("Add Recipes");
        return;
    }
    const recent = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    let candidates = userRecipes.filter(r => !recent.includes(r.name.toLowerCase()));
    const pick = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : userRecipes[0];
    
    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(candidates.length > 0 ? "You haven't had this lately." : "Back to the classics.");
    $('#quick-log-suggested').removeClass('hidden').off().on('click', () => quickLog(pick.name));
    renderQuickSelect();
}

function renderQuickSelect() {
    const recent = historyLogs.slice(0, 5).map(l => l.description.toLowerCase());
    $('#quick-select-bar').html(userRecipes.map(r => {
        const fatigued = recent.includes(r.name.toLowerCase());
        return `<button onclick="window.doLog('${r.name}')" class="glass px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${fatigued ? 'fatigue-high' : 'text-emerald-500'} border border-emerald-500/20">${r.name}</button>`;
    }).join(''));
}
window.doLog = (n) => quickLog(n);

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === today);
    $('#meal-list').html(todayLogs.map(l => `<div class="glass p-4 rounded-xl flex justify-between items-center"><span class="font-bold">${l.description}</span><button onclick="window.delMeal('${l.id}')" class="text-red-500 text-xs">✕</button></div>`).join(''));
}

window.delMeal = async (id) => { if (confirm("Delete entry?")) await deleteDoc(doc(db, "meals", id)); };

function renderHistory() {
    const filterVal = $('#date-filter').val();
    if (!filterVal) return;
    const filtered = historyLogs.filter(l => l.dateStr === filterVal);
    $('#calendar-results').html(filtered.length ? filtered.map(l => `<div class="glass p-4 rounded-xl">${l.description}</div>`).join('') : '<p class="text-center text-gray-500 py-10">No entries for this date.</p>');
}
$('#date-filter').on('change', renderHistory);

// Modal Logic
$('#open-log-modal').click(() => { 
    $('#modal-container').fadeIn().css('display','flex'); 
    $('.modal-content').hide(); 
    $('#log-form').show(); 
});
$('#open-recipe-modal').click(() => { 
    $('#modal-container').fadeIn().css('display','flex'); 
    $('.modal-content').hide(); 
    $('#recipe-form').show(); 
});
$('.close-modal').click(() => $('#modal-container').fadeOut());

$('#log-form').submit((e) => { e.preventDefault(); quickLog($('#logDescription').val()); $('#log-form')[0].reset(); });
$('#recipe-form').submit(async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "recipes"), { uid: currentUser.uid, name: $('#recipeName').val(), instructions: $('#recipeInstructions').val() });
    $('#modal-container').fadeOut();
    $('#recipe-form')[0].reset();
});

// Robust SW Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => console.log("SW Error:", err));
}
