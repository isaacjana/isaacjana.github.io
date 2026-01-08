import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsGbfRlXxqUwLHXbGcwRYOvuygTPgTeMA",
    authDomain: "penny-wise-e482e.firebaseapp.com",
    projectId: "penny-wise-e482e",
    storageBucket: "penny-wise-e482e.firebasestorage.app",
    messagingSenderId: "504425521894",
    appId: "1:504425521894:web:d3bf53689eaf6a3d5e9127"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let currentUser = null;
let allTransactions = [];
let unsubscribe = null;

enableIndexedDbPersistence(db).catch(() => {});

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

const initDataListener = () => {
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
    unsubscribe = onSnapshot(q, (snap) => {
        allTransactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeScreen = $('.nav-link.nav-active').data('screen') || 'dashboard';
        renderScreen(activeScreen);
    });
};

const renderScreen = (screen) => {
    const container = $('#screen-container');
    $('.nav-link').removeClass('nav-active text-indigo-500').addClass('text-slate-400');
    $(`[data-screen="${screen}"]`).addClass('nav-active text-indigo-500');

    if (screen === 'dashboard') renderDashboard(container);
    else if (screen === 'subs') renderSubs(container);
    else if (screen === 'streak') renderStreak(container);
    else if (screen === 'settings') renderSettings(container);
};

const renderDashboard = (container) => {
    const goal = parseFloat(localStorage.getItem('budget_goal') || 5000);
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const monthlyData = allTransactions.filter(t => t.date.toDate().getMonth() === now.getMonth());
    const spent = monthlyData.reduce((acc, t) => acc + t.amount, 0);
    const roundups = monthlyData.reduce((acc, t) => acc + (Math.ceil(t.amount) - t.amount), 0);
    
    const burnRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
    const forecast = burnRate * daysInMonth;
    const isOver = forecast > goal;

    

    container.html(`
        <div class="space-y-6">
            <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all">
                <p class="text-[10px] font-bold uppercase opacity-60 tracking-widest">Monthly Forecast</p>
                <h2 class="text-5xl font-black mt-1 ${isOver ? 'text-red-300 animate-pulse' : ''}">$${forecast.toFixed(0)}</h2>
                <div class="flex justify-between mt-8 pt-4 border-t border-white/10 text-sm">
                    <div><p class="opacity-60">Daily Burn</p><p class="font-bold">$${burnRate.toFixed(2)}</p></div>
                    <div><p class="opacity-60">Round-ups</p><p class="font-bold text-emerald-300">+$${roundups.toFixed(2)}</p></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Actual Spent</p>
                    <p class="text-xl font-black mt-1">$${spent.toFixed(2)}</p>
                </div>
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
                    <p class="text-xl font-black mt-1 text-indigo-500">$${Math.max(0, goal - spent).toFixed(0)}</p>
                </div>
            </div>

            <div id="recent-list" class="space-y-3 pb-10">
                <p class="text-xs font-bold text-slate-400 uppercase px-2">Latest activity</p>
                ${allTransactions.slice(0, 5).map(t => `
                    <div class="flex justify-between items-center p-4 bg-white dark:bg-white/5 rounded-2xl border dark:border-white/5">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">💰</div>
                            <div><p class="font-bold text-sm">${t.description}</p><p class="text-[10px] text-slate-500">${t.category}</p></div>
                        </div>
                        <p class="font-black text-sm">-$${t.amount.toFixed(2)}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `);
};

const renderSubs = (container) => {
    const subs = allTransactions.filter(t => t.category === 'Subscription');
    const grouped = subs.reduce((acc, t) => {
        acc[t.description] = (acc[t.description] || { count: 0, amount: t.amount });
        acc[t.description].count++;
        return acc;
    }, {});

    

    container.html(`
        <h1 class="text-3xl font-black mb-8">Subscriptions</h1>
        <div class="space-y-4">
            ${Object.entries(grouped).map(([name, data]) => `
                <div class="bg-white dark:bg-white/5 p-5 rounded-3xl border dark:border-white/5 flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500"><i class="fas fa-sync-alt"></i></div>
                        <div><p class="font-bold">${name}</p><p class="text-xs text-slate-500">Recurring</p></div>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-indigo-500">-$${data.amount.toFixed(2)}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase">$${(data.amount * 12).toFixed(0)} / yr</p>
                    </div>
                </div>
            `).join('') || '<p class="text-center py-20 text-slate-500">No recurring bills found.</p>'}
        </div>
    `);
};

const renderStreak = (container) => {
    const trDates = new Set(allTransactions.map(t => t.date.toDate().toDateString()));
    let streak = 0;
    let checkDate = new Date();
    
    while (!trDates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 365) break; 
    }

    

    container.html(`
        <div class="text-center py-20">
            <div class="w-40 h-40 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <i class="fas fa-fire text-orange-500 text-7xl animate-pulse"></i>
                <div class="absolute inset-0 border-4 border-orange-500/20 rounded-full scale-110"></div>
            </div>
            <h1 class="text-7xl font-black">${streak}</h1>
            <p class="text-slate-500 font-bold uppercase tracking-widest mt-4">Day No-Spend Streak</p>
            <div class="mt-12 p-6 bg-white dark:bg-white/5 rounded-[2.5rem] border dark:border-white/5 max-w-sm mx-auto">
                <p class="text-sm text-slate-400 italic">"Wealth consists not in having great possessions, but in having few wants."</p>
            </div>
        </div>
    `);
};

const renderSettings = (container) => {
    const isDark = document.documentElement.classList.contains('dark');
    container.html(`
        <h1 class="text-3xl font-black mb-8">Settings</h1>
        <div class="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border dark:border-white/5 space-y-8">
            <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Budget</label>
                <div class="flex space-x-2">
                    <input id="set-goal" type="number" value="${localStorage.getItem('budget_goal') || 5000}" class="flex-1 bg-slate-100 dark:bg-white/5 p-4 rounded-2xl outline-none font-bold">
                    <button id="save-budget" class="bg-indigo-600 text-white px-6 rounded-2xl font-bold">Save</button>
                </div>
            </div>
            <div class="flex justify-between items-center py-4 border-t dark:border-white/5">
                <span class="font-bold">Dark Mode</span>
                <button id="toggle-theme" class="w-12 h-6 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-300'} relative transition-colors">
                    <div class="absolute top-1 ${isDark ? 'left-7' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all"></div>
                </button>
            </div>
            <button id="logout" class="w-full py-5 text-red-500 font-bold border border-red-500/10 rounded-2xl bg-red-500/5">Sign Out</button>
        </div>
    `);
};

$(document).on('click', '.nav-link', function() { renderScreen($(this).data('screen')); });
$(document).on('click', '#open-add-modal', () => $('#modal-transaction').fadeIn().css('display', 'flex'));
$(document).on('click', '.close-modal', () => $('#modal-transaction').fadeOut());
$(document).on('click', '#save-budget', () => { localStorage.setItem('budget_goal', $('#set-goal').val()); alert('Settings saved'); renderScreen('dashboard'); });
$(document).on('click', '#logout', () => signOut(auth));
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
        alert("Error saving: " + err.message);
    } finally {
        btn.prop('disabled', false).text('Save Transaction');
    }
});
