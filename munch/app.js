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

// --- THE ANALYTICAL DECISION ENGINE ---

async function runAnalysis() {
    if (userRecipes.length === 0) return;

    const recentMealNames = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    
    // Find recipes NOT eaten in the last 10 entries
    let suggestions = userRecipes.filter(r => !recentMealNames.includes(r.name.toLowerCase()));
    
    // Fallback: If everything has been eaten recently, suggest the oldest eaten one
    if (suggestions.length === 0) suggestions = [...userRecipes];

    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];

    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(recentMealNames.includes(pick.name.toLowerCase()) ? "A favorite you eat often." : "Based on your vault, you haven't had this recently.");
    $('#quick-log-suggested').removeClass('hidden').off().on('click', () => quickLog(pick.name));
}

// UI HANDLERS
$('#dark-mode-toggle').click(() => $('html').toggleClass('dark'));
$('.nav-item').click(function() {
    $('.view-section').removeClass('active');
    $(`#view-${$(this).data('target')}`).addClass('active');
    $('.nav-item').removeClass('text-emerald-500').addClass('text-gray-500');
    $(this).addClass('text-emerald-500');
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').fadeOut();
        $('#app').removeClass('hidden');
        initListeners();
    } else { $('#auth-overlay').show(); }
});
$('#login-btn').click(() => signInWithPopup(auth, provider));

// FIREBASE LISTENERS
function initListeners() {
    // Sync Recipes
    onSnapshot(query(collection(db, "recipes"), where("uid", "==", currentUser.uid)), (snap) => {
        userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();
        runAnalysis();
    });

    // Sync History
    onSnapshot(query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc")), (snap) => {
        historyLogs = snap.docs.map(d => d.data());
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
    if (window.navigator.vibrate) window.navigator.vibrate(15);
}

function renderRecipes() {
    $('#recipe-list').html(userRecipes.map(r => `
        <div class="glass p-6 rounded-[2rem] border-white/5">
            <h4 class="font-bold text-lg">${r.name}</h4>
            <p class="text-xs text-gray-500 mt-2">${r.instructions?.substring(0,60) || 'Quick log recipe'}...</p>
        </div>
    `).join(''));
}

function renderHistory() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === today);
    $('#meal-list').html(todayLogs.map(l => `<div class="glass p-5 rounded-2xl font-bold border-l-4 border-emerald-500">${l.description}</div>`).join(''));
    
    $('#date-filter').on('change', function() {
        const val = $(this).val();
        const results = historyLogs.filter(l => l.dateStr === val);
        $('#calendar-results').html(results.map(l => `<div class="glass p-5 rounded-2xl">${l.description}</div>`).join(''));
    });
}

// MODALS
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
