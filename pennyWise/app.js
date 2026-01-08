import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, enableIndexedDbPersistence, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsGbfRlXxqUwLHXbGcwRYOvuygTPgTeMA",
    authDomain: "penny-wise-e482e.firebaseapp.com",
    projectId: "penny-wise-e482e",
    storageBucket: "penny-wise-e482e.firebasestorage.app",
    messagingSenderId: "504425521894",
    appId: "1:504425521894:web:d3bf53689eaf6a3d5e9127"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let allTransactions = [];
let unsubscribe = null;

// Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') console.log("Multiple tabs open, persistence failed.");
    else if (err.code == 'unimplemented') console.log("Browser does not support persistence.");
});

// Authentication Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').fadeOut();
        $('#app').removeClass('hidden');
        initDataListener();
    } else {
        if (unsubscribe) unsubscribe();
        currentUser = null;
        $('#auth-overlay').fadeIn();
        $('#app').addClass('hidden');
    }
});

// Real-time Data Listener
function initDataListener() {
    const q = query(
        collection(db, "transactions"), 
        where("uid", "==", currentUser.uid), 
        orderBy("date", "desc")
    );

    unsubscribe = onSnapshot(q, (snap) => {
        allTransactions = snap.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            date: d.data().date?.toDate() || new Date() 
        }));
        const activeScreen = $('.nav-link.nav-active').data('screen') || 'dashboard';
        renderScreen(activeScreen);
    }, (error) => {
        console.error("Firestore Error:", error);
    });
}

// Screen Router
function renderScreen(screen) {
    const container = $('#screen-container');
    $('.nav-link').removeClass('nav-active text-indigo-500').addClass('text-slate-400');
    $(`[data-screen="${screen}"]`).addClass('nav-active text-indigo-500');

    if (screen === 'dashboard') renderDashboard(container);
    else if (screen === 'subs') renderSubs(container);
    else if (screen === 'streak') renderStreak(container);
    else if (screen === 'settings') renderSettings(container);
}

// Dashboard Logic (Burn Rate & Forecast)
function renderDashboard(container) {
    const goal = parseFloat(localStorage.getItem('budget_goal') || 5000);
    const now = new Date();
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const monthly = allTransactions.filter(t => t.date.getMonth() === now.getMonth());
    const spent = monthly.reduce((s, t) => s + t.amount, 0);
    const roundups = monthly.reduce((s, t) => s + (Math.ceil(t.amount) - t.amount), 0);
    const forecast = day > 0 ? (spent / day) * daysInMonth : 0;
    const pacePerc = Math.min((spent / goal) * 100, 100);

    

    container.html(`
        <div class="space-y-6">
            <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <p class="text-[10px] font-bold uppercase opacity-60 tracking-widest">Monthly Forecast</p>
                <h2 class="text-5xl font-black mt-1">$${forecast.toFixed(0)}</h2>
                <div class="flex justify-between mt-8 pt-4 border-t border-white/10 text-sm">
                    <div><p class="opacity-60">Daily Burn</p><p class="font-bold">$${(spent/day || 0).toFixed(2)}</p></div>
                    <div><p class="opacity-60">Round-ups</p><p class="font-bold text-emerald-300">+$${roundups.toFixed(2)}</p></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5 shadow-sm">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Actual Spent</p>
                    <p class="text-xl font-black">$${spent.toFixed(2)}</p>
                </div>
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5 shadow-sm">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Budget Pace</p>
                    <p class="text-xl font-black text-indigo-500">${pacePerc.toFixed(0)}%</p>
                </div>
            </div>

            <h3 class="font-bold text-slate-400 px-2 mt-4">Activity</h3>
            <div class="space-y-3 pb-20">
                ${allTransactions.length > 0 ? allTransactions.map(t => `
                    <div class="bg-white dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center border dark:border-white/5 shadow-sm transition-all">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">💰</div>
                            <div>
                                <p class="font-bold text-sm text-slate-800 dark:text-slate-100">${t.description}</p>
                                <div class="flex space-x-2 text-[10px] font-bold text-slate-500 uppercase">
                                    <span>${t.category}</span>
                                    <button onclick="window.editTr('${t.id}', '${t.description}', ${t.amount})" class="text-indigo-500 hover:text-indigo-600">Edit</button>
                                    <button onclick="window.delTr('${t.id}')" class="text-red-500 hover:text-red-600">Del</button>
                                </div>
                            </div>
                        </div>
                        <p class="font-black text-sm text-slate-800 dark:text-white">-$${t.amount.toFixed(2)}</p>
                    </div>
                `).join('') : '<p class="text-center py-10 text-slate-500">No transactions logged.</p>'}
            </div>
        </div>
    `);
}

// Subscription Detection Logic
function renderSubs(container) {
    const subs = allTransactions.filter(t => t.category === 'Subscription');
    const grouped = subs.reduce((acc, t) => {
        const key = t.description.toLowerCase();
        if (!acc[key]) acc[key] = { name: t.description, amount: t.amount, count: 0 };
        acc[key].count++;
        return acc;
    }, {});

    

    container.html(`
        <h1 class="text-3xl font-black mb-8">Subscriptions</h1>
        <div class="space-y-4">
            ${Object.values(grouped).map(s => `
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5 flex justify-between items-center shadow-sm">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 text-xl"><i class="fas fa-sync-alt"></i></div>
                        <div><p class="font-bold text-lg">${s.name}</p><p class="text-xs text-slate-500">Recurring</p></div>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-indigo-500">-$${s.amount.toFixed(2)}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">$${(s.amount * 12).toFixed(0)}/yr</p>
                    </div>
                </div>
            `).join('') || '<p class="text-center py-20 text-slate-500">No recurring bills detected.</p>'}
        </div>
    `);
}

// Streak Calculation Logic
function renderStreak(container) {
    const trDates = new Set(allTransactions.map(t => t.date.toDateString()));
    let streak = 0;
    let checkDate = new Date();
    
    while (!trDates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 365) break; 
    }

    

    container.html(`
        <div class="text-center py-20">
            <div class="w-44 h-44 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <i class="fas fa-fire text-orange-500 text-7xl animate-pulse"></i>
                <div class="absolute inset-0 border-4 border-orange-500/20 rounded-full animate-ping opacity-20"></div>
            </div>
            <h1 class="text-8xl font-black tracking-tighter">${streak}</h1>
            <p class="text-slate-500 font-bold uppercase tracking-widest mt-4">Day No-Spend Streak</p>
        </div>
    `);
}

// Settings & Dark Mode
function renderSettings(container) {
    const isDark = document.documentElement.classList.contains('dark');
    container.html(`
        <h1 class="text-3xl font-black mb-8">Settings</h1>
        <div class="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border dark:border-white/5 space-y-8 shadow-sm">
            <div class="space-y-3">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Goal ($)</label>
                <div class="flex space-x-2">
                    <input id="set-goal" type="number" value="${localStorage.getItem('budget_goal') || 5000}" class="flex-1 bg-slate-100 dark:bg-white/5 p-4 rounded-2xl outline-none font-bold text-lg">
                    <button id="save-budget" class="bg-indigo-600 text-white px-8 rounded-2xl font-bold transition active:scale-95">Set</button>
                </div>
            </div>
            <div class="flex justify-between items-center py-4 border-t dark:border-white/5">
                <span class="font-bold">Dark Mode</span>
                <button id="toggle-theme" class="w-14 h-7 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-300'} relative transition-all">
                    <div class="absolute top-1 ${isDark ? 'left-8' : 'left-1'} w-5 h-5 bg-white rounded-full transition-all"></div>
                </button>
            </div>
            <button id="logout" class="w-full py-5 text-red-500 font-bold border border-red-500/10 rounded-2xl bg-red-500/5 transition active:scale-95">Sign Out</button>
        </div>
    `);
}

// Global UI Handlers
$(document).on('click', '.nav-link', function() { renderScreen($(this).data('screen')); });
$(document).on('click', '#btn-login', () => signInWithPopup(auth, provider));
$(document).on('click', '#logout', () => signOut(auth));
$(document).on('click', '#open-add-modal', () => $('#modal-transaction').fadeIn().css('display', 'flex'));
$(document).on('click', '.close-modal', () => $('#modal-transaction').fadeOut());

// CRUD Operations
window.delTr = async (id) => { 
    if (confirm("Delete this entry permanently?")) {
        try { await deleteDoc(doc(db, "transactions", id)); } 
        catch (e) { alert("Delete failed: " + e.message); }
    }
};

window.editTr = async (id, currentDesc, currentAmount) => {
    const newDesc = prompt("Edit Description:", currentDesc);
    const newAmount = prompt("Edit Amount:", currentAmount);
    if (newDesc && newAmount) {
        try { 
            await updateDoc(doc(db, "transactions", id), { 
                description: newDesc, 
                amount: parseFloat(newAmount) 
            }); 
        } catch (e) { alert("Edit failed: " + e.message); }
    }
};

$(document).on('click', '#save-budget', () => { 
    localStorage.setItem('budget_goal', $('#set-goal').val()); 
    alert('Target Updated'); 
    renderScreen('dashboard'); 
});

$(document).on('click', '#toggle-theme', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    renderScreen('settings');
});

$('#form-transaction').submit(async function(e) {
    e.preventDefault();
    const btn = $(this).find('button');
    btn.prop('disabled', true).text('Saving...');
    
    try {
        await addDoc(collection(db, "transactions"), {
            uid: currentUser.uid,
            amount: parseFloat($('#tr-amount').val()),
            description: $('#tr-desc').val(),
            category: $('#tr-category').val(),
            date: new Date()
        });
        $('#modal-transaction').fadeOut();
        this.reset();
    } catch (err) {
        alert("Error saving transaction: " + err.message);
    } finally {
        btn.prop('disabled', false).text('Save');
    }
});
