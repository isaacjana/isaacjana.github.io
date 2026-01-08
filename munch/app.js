import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, orderBy, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
let recentLogs = [];

// --- THE ANALYTICAL ENGINE ---
async function generateMealSuggestion() {
    if (userRecipes.length === 0) {
        $('#suggested-meal-name').text("Add some recipes first!");
        $('#suggested-reason').text("Create recipes in the Vault to get suggestions.");
        return;
    }

    // Logic: Find recipes that haven't been logged in the last 3 days
    const recentNames = recentLogs.map(l => l.description.toLowerCase());
    const candidates = userRecipes.filter(r => !recentNames.includes(r.name.toLowerCase()));

    const pick = candidates.length > 0 
        ? candidates[Math.floor(Math.random() * candidates.length)] 
        : userRecipes[Math.floor(Math.random() * userRecipes.length)];

    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(candidates.length > 0 ? "You haven't had this in a while." : "A high-frequency favorite of yours.");
    $('#quick-log-suggested').removeClass('hidden').off().on('click', () => logMeal(pick.name));
}

// --- CORE FUNCTIONS ---
async function logMeal(name) {
    const payload = {
        uid: currentUser.uid,
        mealType: "Logged",
        description: name,
        createdAt: serverTimestamp(),
        dateStr: new Date().toISOString().split('T')[0]
    };
    await addDoc(collection(db, "meals"), payload);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

// UI Toggles
$('#dark-mode-toggle').click(() => $('html').toggleClass('dark'));
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
        initRealtimeListeners();
    } else {
        $('#auth-overlay').show();
    }
});
$('#login-btn').click(() => signInWithPopup(auth, provider));

// Realtime Listeners
function initRealtimeListeners() {
    // Recipes
    onSnapshot(query(collection(db, "recipes"), where("uid", "==", currentUser.uid)), (snap) => {
        userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();
        generateMealSuggestion();
    });

    // History (last 50 meals)
    const q = query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
        recentLogs = snap.docs.map(d => d.data());
        renderDashboard();
        generateMealSuggestion();
    });
}

function renderRecipes() {
    let html = userRecipes.map(r => `
        <div class="glass p-5 rounded-2xl">
            <h4 class="font-bold text-lg">${r.name}</h4>
            <p class="text-xs text-gray-500">${r.instructions || 'No ingredients listed'}</p>
        </div>
    `).join('');
    $('#recipe-list').html(html);
}

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = recentLogs.filter(l => l.dateStr === today);
    $('#meal-list').html(todayLogs.map(l => `
        <div class="glass p-4 rounded-xl flex justify-between">
            <span class="font-bold">${l.description}</span>
        </div>
    `).join(''));
}

// Modal Handlers
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
