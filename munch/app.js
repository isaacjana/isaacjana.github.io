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

// --- HELPER: GET CATEGORY FROM DATE ---
function getCategory(dateObj) {
    const h = dateObj.getHours();
    if (h >= 4 && h < 11) return 'breakfast';
    if (h >= 11 && h < 16) return 'lunch';
    if (h >= 16 && h < 21) return 'dinner';
    return 'snack';
}

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

// --- UI INTERACTIONS ---
// Collapsible Categories
$(document).on('click', '.toggle-header', function() {
    $(this).toggleClass('collapsed');
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
        historyLogs = snap.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                timestamp: data.createdAt ? data.createdAt.toDate() : new Date() 
            };
        });

        renderDashboard();
        
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
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = historyLogs.filter(l => l.dateStr === todayStr);
    
    // Reset Views
    $('#list-breakfast, #list-lunch, #list-dinner, #list-snack').html('');
    $('#section-breakfast, #section-lunch, #section-dinner, #section-snack, #empty-state').addClass('hidden');

    if (todayLogs.length === 0) {
        $('#empty-state').removeClass('hidden');
        return;
    }

    const buckets = { breakfast: [], lunch: [], dinner: [], snack: [] };

    todayLogs.forEach(log => {
        const cat = getCategory(log.timestamp);
        buckets[cat].push(log);
    });

    Object.keys(buckets).forEach(key => {
        if (buckets[key].length > 0) {
            $(`#section-${key}`).removeClass('hidden');
            const html = buckets[key].map(l => `
                <div class="glass p-4 rounded-xl flex justify-between items-center mb-2">
                    <span class="font-bold text-sm">${l.description}</span>
                    <button class="delete-log-btn text-gray-500 text-xs px-2" data-id="${l.id}">✕</button>
                </div>
            `).join('');
            $(`#list-${key}`).html(html);
        }
    });
}

function renderHistory() {
    const dateVal = $('#date-filter').val();
    const catVal = $('#category-filter').val();
    
    // Filter by Date AND Category
    const filtered = historyLogs.filter(l => {
        const matchesDate = l.dateStr === dateVal;
        const matchesCat = catVal === 'all' || getCategory(l.timestamp) === catVal;
        return matchesDate && matchesCat;
    });

    const html = filtered.map(l => `
        <div class="glass p-4 rounded-xl mb-2 flex justify-between items-center">
            <div>
                <span class="block font-bold">${l.description}</span>
                <span class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">${getCategory(l.timestamp)}</span>
            </div>
            <span class="text-xs text-gray-500">${l.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `).join('');
    
    $('#calendar-results').html(html || '<p class="text-center text-gray-500 py-4">No entries match filters.</p>');
}

// Bind Filter Events
$('#date-filter, #category-filter').on('change', renderHistory);

// --- ANALYSIS ---
function runAnalysis() {
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

// --- ACTIONS ---
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
