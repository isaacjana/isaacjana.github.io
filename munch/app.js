import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// Decision Engine
async function runAnalysis() {
    if (userRecipes.length === 0) {
        $('#suggested-meal-name').text("Add Recipes");
        return;
    }
    const recentNames = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    let candidates = userRecipes.filter(r => !recentNames.includes(r.name.toLowerCase()));
    
    const pick = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : userRecipes[0];
    
    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(candidates.length > 0 ? "You haven't had this in a while." : "A frequent favorite.");
    $('#quick-log-suggested').removeClass('hidden').off().on('click', () => quickLog(pick.name));
    
    renderQuickSelect();
}

// Dark Mode Toggle Fix
$('#dark-mode-toggle').click(() => {
    $('html').toggleClass('dark');
    localStorage.setItem('theme', $('html').hasClass('dark') ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'light') $('html').removeClass('dark');

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
        $('#auth-overlay').fadeOut();
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
        historyLogs = snap.docs.map(d => d.data());
        renderDashboard();
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
    if (window.navigator.vibrate) window.navigator.vibrate(15);
}

function renderQuickSelect() {
    const recentNames = historyLogs.slice(0, 5).map(l => l.description.toLowerCase());
    const html = userRecipes.map(r => {
        const isFatigued = recentNames.includes(r.name.toLowerCase());
        return `<button onclick="window.logFromChip('${r.name}')" class="glass px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${isFatigued ? 'fatigue-high' : 'text-emerald-500'} border border-emerald-500/20">${r.name}</button>`;
    }).join('');
    $('#quick-select-bar').html(html);
}
window.logFromChip = (name) => quickLog(name);

function renderRecipes() {
    $('#recipe-list').html(userRecipes.map(r => `<div class="glass p-5 rounded-2xl">
        <h4 class="font-bold">${r.name}</h4>
        <p class="text-xs text-gray-500 mt-1">${r.instructions || ''}</p>
    </div>`).join(''));
}

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === today);
    $('#meal-list').html(todayLogs.map(l => `<div class="glass p-4 rounded-xl border-l-4 border-emerald-500 font-bold">${l.description}</div>`).join(''));
}

// Modals
$('#open-recipe-modal').click(() => $('#recipe-modal').fadeIn().css('display', 'flex'));
$('.close-modal').click(() => $('#recipe-modal').fadeOut());

$('#recipe-form').submit(async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "recipes"), {
        uid: currentUser.uid,
        name: $('#recipeName').val(),
        instructions: $('#recipeInstructions').val(),
        createdAt: serverTimestamp()
    });
    $('#recipe-modal').fadeOut();
    $('#recipe-form')[0].reset();
});
