import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Offline support
enableIndexedDbPersistence(db).catch((err) => console.log("Persistence:", err.code));

// State Variables
let currentUser = null;
let userRecipes = [];
let historyLogs = [];

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default to dark if nothing saved
    if (savedTheme === 'light') {
        $('html').removeClass('dark');
    } else {
        $('html').addClass('dark');
    }
}
initTheme();

$('#dark-mode-toggle').click(() => {
    const isDark = $('html').hasClass('dark');
    if (isDark) {
        $('html').removeClass('dark');
        localStorage.setItem('theme', 'light');
    } else {
        $('html').addClass('dark');
        localStorage.setItem('theme', 'dark');
    }
});

// --- NAVIGATION ---
$('.nav-item').click(function() {
    const target = $(this).data('target');
    $('.view-section').removeClass('active');
    $(`#view-${target}`).addClass('active');
    
    // Update Active State
    $('.nav-item').removeClass('text-emerald-500').addClass('text-gray-500');
    $(this).removeClass('text-gray-500').addClass('text-emerald-500');
});

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').fadeOut();
        $('#app').removeClass('hidden');
        initListeners();
    } else {
        $('#auth-overlay').fadeIn();
        $('#app').addClass('hidden');
    }
});

$('#login-btn').click(() => signInWithPopup(auth, provider));

// --- DATA LISTENERS ---
function initListeners() {
    // 1. Listen for Recipes
    const recipeQ = query(collection(db, "recipes"), where("uid", "==", currentUser.uid));
    onSnapshot(recipeQ, (snap) => {
        userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();     // Now strictly defined before usage
        runAnalysis();
    });

    // 2. Listen for Logs (History)
    const historyQ = query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
    onSnapshot(historyQ, (snap) => {
        historyLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDashboard();
        
        // Initialize history view with today's date
        const todayStr = new Date().toISOString().split('T')[0];
        if (!$('#date-filter').val()) $('#date-filter').val(todayStr);
        renderHistory(); 

        runAnalysis();
    });
}

// --- RENDERING FUNCTIONS ---
function renderRecipes() {
    const html = userRecipes.map(r => `
        <div class="glass p-5 rounded-2xl flex justify-between items-start group">
            <div>
                <h4 class="font-bold text-lg">${r.name}</h4>
                <p class="text-xs text-gray-500 mt-1">${r.instructions || 'No details.'}</p>
            </div>
            <button onclick="window.deleteRecipe('${r.id}')" class="text-gray-600 hover:text-red-500 p-2">✕</button>
        </div>
    `).join('');
    
    $('#recipe-list').html(html || '<p class="text-center text-gray-500 py-4">No recipes yet.</p>');
}

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === today);
    
    const html = todayLogs.map(l => `
        <div class="glass p-4 rounded-xl flex justify-between items-center border-l-4 border-emerald-500">
            <span class="font-bold text-sm">${l.description}</span>
            <button onclick="window.deleteLog('${l.id}')" class="text-gray-500 text-xs px-2 py-1">✕</button>
        </div>
    `).join('');
    
    $('#meal-list').html(html || '<p class="text-sm text-gray-500 text-center italic py-2">No meals logged today.</p>');
}

function renderHistory() {
    const selectedDate = $('#date-filter').val();
    const filtered = historyLogs.filter(l => l.dateStr === selectedDate);
    
    const html = filtered.map(l => `
        <div class="glass p-4 rounded-xl flex justify-between items-center">
            <span class="font-bold text-gray-700 dark:text-gray-200">${l.description}</span>
            <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Logged</span>
        </div>
    `).join('');
    
    $('#calendar-results').html(html || '<p class="text-center text-gray-500 py-10">No entries found for this date.</p>');
}

// Bind History Input
$('#date-filter').on('change', renderHistory);

function renderQuickSelect() {
    const recentDesc = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    
    const html = userRecipes.map(r => {
        const isFatigued = recentDesc.includes(r.name.toLowerCase());
        const classes = isFatigued 
            ? 'fatigue-high border-gray-700 text-gray-700' 
            : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black';
            
        return `<button onclick="window.quickLog('${r.name}')" class="glass px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all border ${classes}">${r.name}</button>`;
    }).join('');
    
    $('#quick-select-bar').html(html);
}

// --- ANALYSIS ENGINE ---
function runAnalysis() {
    renderQuickSelect(); // Update chips based on new history
    
    if (userRecipes.length === 0) {
        $('#suggested-meal-name').text("Add Recipes");
        $('#suggested-reason').text("Add recipes to Vault to unlock AI suggestions.");
        return;
    }

    const recentDesc = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    // Filter recipes NOT eaten recently
    let candidates = userRecipes.filter(r => !recentDesc.includes(r.name.toLowerCase()));
    
    // Fallback if user eats everything in rotation
    if (candidates.length === 0) candidates = [...userRecipes];

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    
    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(candidates.length < userRecipes.length ? "You haven't logged this recently." : "A staple from your vault.");
    
    // Enable button
    $('#quick-log-suggested')
        .removeClass('hidden')
        .off('click')
        .on('click', () => window.quickLog(pick.name));
}

// --- LOGGING ACTIONS ---
window.quickLog = async (name) => {
    const payload = {
        uid: currentUser.uid,
        description: name,
        createdAt: serverTimestamp(),
        dateStr: new Date().toISOString().split('T')[0]
    };
    
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    
    // Optimistic UI updates happen via Snapshot, no manual DOM manip needed
    await addDoc(collection(db, "meals"), payload);
    
    // Close modals if open
    $('#modal-container').fadeOut();
};

window.deleteLog = async (id) => {
    if(confirm("Remove this entry?")) {
        await deleteDoc(doc(db, "meals", id));
    }
};

window.deleteRecipe = async (id) => {
    if(confirm("Delete this recipe?")) {
        await deleteDoc(doc(db, "recipes", id));
    }
};

// --- MODAL HANDLING ---
const openModal = (type) => {
    $('#modal-container').fadeIn().css('display', 'flex');
    $('.modal-content').hide(); // Hide all inner forms
    $(`#${type}-form`).show();  // Show specific form
};

$('#open-log-modal').click(() => openModal('log'));
$('#open-recipe-modal').click(() => openModal('recipe'));
$('.close-modal').click(() => $('#modal-container').fadeOut());

// Form Submissions
$('#log-form').submit((e) => {
    e.preventDefault();
    window.quickLog($('#logDescription').val());
    $('#log-form')[0].reset();
});

$('#recipe-form').submit(async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "recipes"), {
        uid: currentUser.uid,
        name: $('#recipeName').val(),
        instructions: $('#recipeInstructions').val() || ""
    });
    $('#modal-container').fadeOut();
    $('#recipe-form')[0].reset();
});
