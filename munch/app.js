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

enableIndexedDbPersistence(db).catch(err => console.log("Offline mode error:", err.code));

let currentUser = null;
let userRecipes = [];
let historyLogs = [];

// --- THEME ---
if (localStorage.getItem('theme') === 'light') $('html').removeClass('dark');
$('#dark-mode-toggle').click(() => {
    $('html').toggleClass('dark');
    localStorage.setItem('theme', $('html').hasClass('dark') ? 'dark' : 'light');
});

// --- NAVIGATION ---
$('.nav-item').click(function() {
    const target = $(this).data('target');
    $('.view-section').removeClass('active');
    $(`#view-${target}`).addClass('active');
    $('.nav-item').removeClass('text-emerald-500').addClass('text-gray-500');
    $(this).addClass('text-emerald-500').removeClass('text-gray-500');
});

// --- AUTH ---
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

// --- DATA ENGINE ---
function initListeners() {
    // 1. Recipes
    onSnapshot(query(collection(db, "recipes"), where("uid", "==", currentUser.uid)), (snap) => {
        userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();
        runAnalysis();
    });

    // 2. History
    const hQ = query(collection(db, "meals"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
    onSnapshot(hQ, (snap) => {
        historyLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDashboard();
        
        // Auto-select today if empty
        if (!$('#date-filter').val()) {
            $('#date-filter').val(new Date().toISOString().split('T')[0]);
        }
        renderHistory();
        runAnalysis();
    });
}

// --- RENDERERS ---
function renderRecipes() {
    const html = userRecipes.map(r => `
        <div class="glass p-5 rounded-2xl flex justify-between items-start">
            <div>
                <h4 class="font-bold text-lg">${r.name}</h4>
                <p class="text-xs text-gray-500 mt-1">${r.instructions || ''}</p>
            </div>
            <button class="delete-recipe-btn text-gray-600 p-2" data-id="${r.id}">✕</button>
        </div>
    `).join('');
    $('#recipe-list').html(html || '<p class="text-center text-gray-500">No recipes found.</p>');
}

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === today);
    const html = todayLogs.map(l => `
        <div class="glass p-4 rounded-xl flex justify-between items-center border-l-4 border-emerald-500">
            <span class="font-bold">${l.description}</span>
            <button class="delete-log-btn text-gray-500 text-xs px-2" data-id="${l.id}">✕</button>
        </div>
    `).join('');
    $('#meal-list').html(html || '<p class="text-center text-sm text-gray-500">No logs today.</p>');
}

function renderHistory() {
    const selected = $('#date-filter').val();
    const filtered = historyLogs.filter(l => l.dateStr === selected);
    const html = filtered.map(l => `
        <div class="glass p-4 rounded-xl mb-2">
            <span class="font-bold">${l.description}</span>
        </div>
    `).join('');
    $('#calendar-results').html(html || '<p class="text-center text-gray-500 py-4">Nothing logged on this date.</p>');
}
$('#date-filter').on('change', renderHistory);

function renderQuickSelect() {
    const recent = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    const html = userRecipes.map(r => {
        const fatigued = recent.includes(r.name.toLowerCase());
        const style = fatigued ? 'fatigue-high' : 'text-emerald-500 border-emerald-500/30';
        return `<button class="quick-add-btn glass px-4 py-2 rounded-full text-xs font-bold border ${style} mr-2 active:scale-95" data-name="${r.name}">${r.name}</button>`;
    }).join('');
    $('#quick-select-bar').html(html);
}

// --- ANALYSIS ---
function runAnalysis() {
    renderQuickSelect();
    if (userRecipes.length === 0) {
        $('#suggested-meal-name').text("Add Recipes");
        $('#suggested-reason').text("Add recipes to get AI suggestions.");
        return;
    }
    const recent = historyLogs.slice(0, 10).map(l => l.description.toLowerCase());
    let candidates = userRecipes.filter(r => !recent.includes(r.name.toLowerCase()));
    if (candidates.length === 0) candidates = [...userRecipes];
    
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    $('#suggested-meal-name').text(pick.name);
    $('#suggested-reason').text(candidates.length < userRecipes.length ? "You haven't had this lately." : "A staple favorite.");
    
    $('#quick-log-suggested').removeClass('hidden').off().on('click', () => doLog(pick.name));
}

// --- ACTIONS (Event Delegation for Module Scope) ---
async function doLog(name) {
    await addDoc(collection(db, "meals"), {
        uid: currentUser.uid,
        description: name,
        createdAt: serverTimestamp(),
        dateStr: new Date().toISOString().split('T')[0]
    });
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    $('#modal-container').fadeOut();
}

$(document).on('click', '.quick-add-btn', function() { doLog($(this).data('name')); });
$(document).on('click', '.delete-log-btn', async function() {
    if(confirm("Delete log?")) await deleteDoc(doc(db, "meals", $(this).data('id')));
});
$(document).on('click', '.delete-recipe-btn', async function() {
    if(confirm("Delete recipe?")) await deleteDoc(doc(db, "recipes", $(this).data('id')));
});

// --- MODALS ---
$('#open-log-modal').click(() => { $('#modal-container').fadeIn().css('display','flex'); $('.modal-content').hide(); $('#log-form').show(); });
$('#open-recipe-modal').click(() => { $('#modal-container').fadeIn().css('display','flex'); $('.modal-content').hide(); $('#recipe-form').show(); });
$('.close-modal').click(() => $('#modal-container').fadeOut());

$('#log-form').submit((e) => { e.preventDefault(); doLog($('#logDescription').val()); $('#log-form')[0].reset(); });
$('#recipe-form').submit(async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "recipes"), { uid: currentUser.uid, name: $('#recipeName').val(), instructions: $('#recipeInstructions').val() || "" });
    $('#modal-container').fadeOut(); 
    $('#recipe-form')[0].reset();
});

// Register SW
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
