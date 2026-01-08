import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, getDocs, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

enableIndexedDbPersistence(db).catch(() => {});

const applyDarkMode = () => {
    const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
};
applyDarkMode();

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        $('#auth-overlay').fadeOut();
        $('#app').removeClass('hidden');
        loadScreen('dashboard');
    } else {
        $('#auth-overlay').show();
        $('#app').addClass('hidden');
    }
});

$('#btn-login').click(() => signInWithPopup(auth, provider));

$(document).on('click', '.nav-link', function() {
    $('.nav-link').removeClass('nav-active').addClass('text-slate-400');
    $(this).addClass('nav-active');
    loadScreen($(this).data('screen'));
});

function loadScreen(screen) {
    const container = $('#screen-container');
    container.fadeOut(100, () => {
        if (screen === 'dashboard') renderDashboard();
        else if (screen === 'transactions') renderTransactions();
        else if (screen === 'reports') renderReports();
        else if (screen === 'settings') renderSettings();
        container.fadeIn(100);
    });
}

function renderDashboard() {
    $('#screen-container').html(`
        <div class="mb-8 flex justify-between items-center">
            <div><h1 class="text-3xl font-black">Dashboard</h1></div>
            <div id="round-up-info" class="text-right">
                <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Auto Savings</p>
                <p id="total-roundup" class="text-lg font-black">$0.00</p>
            </div>
        </div>
        <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl mb-6 relative overflow-hidden">
            <p class="opacity-60 text-xs font-bold uppercase">Spent this month</p>
            <h2 id="dash-spent" class="text-5xl font-black mt-2 tracking-tighter">$0.00</h2>
            <div class="mt-8 bg-white/20 h-2 rounded-full overflow-hidden">
                <div id="pace-bar" class="bg-white h-full transition-all duration-1000" style="width: 0%"></div>
            </div>
        </div>
        <div class="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 mb-8">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold">Savings Bucket</h3>
                <span id="bucket-perc" class="text-xs font-bold text-indigo-500">0%</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                <div id="bucket-bar" class="bg-emerald-500 h-full transition-all" style="width: 0%"></div>
            </div>
        </div>
        <h3 class="font-bold text-lg mb-4 text-slate-400">Recent Transactions</h3>
        <div id="recent-list" class="space-y-3 pb-20"></div>
    `);
    syncData();
}

function syncData() {
    if (!currentUser) return;
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
    
    onSnapshot(q, (snap) => {
        let total = 0;
        let roundups = 0;
        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            total += t.amount;
            const roundUp = Math.ceil(t.amount) - t.amount;
            roundups += roundUp;
            html += `
                <div class="bg-white dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-slate-200 dark:border-white/5">
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">💰</div>
                        <div><p class="font-bold">${t.description}</p><p class="text-xs text-slate-500">${t.category}</p></div>
                    </div>
                    <div class="text-right">
                        <p class="font-black">-$${t.amount.toFixed(2)}</p>
                        ${roundUp > 0 ? `<p class="text-[10px] text-emerald-500 font-bold">+$${roundUp.toFixed(2)} saved</p>` : ''}
                    </div>
                </div>`;
        });
        const goal = parseFloat(localStorage.getItem('budget_goal') || 5000);
        const bucketGoal = parseFloat(localStorage.getItem('bucket_goal') || 1000);
        $('#dash-spent').text(`$${total.toFixed(2)}`);
        $('#total-roundup').text(`$${roundups.toFixed(2)}`);
        $('#pace-bar').css('width', Math.min((total / goal) * 100, 100) + '%');
        
        const bPerc = Math.min((roundups / bucketGoal) * 100, 100);
        $('#bucket-bar').css('width', bPerc + '%');
        $('#bucket-perc').text(bPerc.toFixed(0) + '%');
        $('#recent-list, #trans-list').html(html || '<p class="text-center py-20 text-slate-400">No data</p>');
    });
}

function renderSettings() {
    const goal = localStorage.getItem('budget_goal') || 5000;
    const bGoal = localStorage.getItem('bucket_goal') || 1000;
    const isDark = document.documentElement.classList.contains('dark');
    $('#screen-container').html(`
        <h1 class="text-3xl font-black mb-8">Settings</h1>
        <div class="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-8">
            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Spending Limit</label>
                <input id="set-goal" type="number" value="${goal}" class="w-full mt-2 bg-slate-100 dark:bg-white/5 p-4 rounded-xl border-none font-bold outline-none">
            </div>
            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Savings Bucket Goal</label>
                <input id="set-bucket" type="number" value="${bGoal}" class="w-full mt-2 bg-slate-100 dark:bg-white/5 p-4 rounded-xl border-none font-bold outline-none">
            </div>
            <button id="save-settings" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Save Changes</button>
            <div class="flex justify-between items-center py-4 border-t border-slate-200 dark:border-white/5">
                <span class="font-bold text-sm">Dark Appearance</span>
                <button id="toggle-theme" class="w-12 h-6 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-300'} relative transition-colors">
                    <div class="absolute top-1 ${isDark ? 'left-7' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all"></div>
                </button>
            </div>
            <button id="logout" class="w-full py-4 text-red-500 font-bold border border-red-500/20 rounded-xl">Sign Out</button>
        </div>
    `);
}

$(document).on('click', '#save-settings', () => {
    localStorage.setItem('budget_goal', $('#set-goal').val());
    localStorage.setItem('bucket_goal', $('#set-bucket').val());
    alert('Settings Saved');
    loadScreen('dashboard');
});

$(document).on('click', '#toggle-theme', function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    $(this).toggleClass('bg-indigo-600 bg-slate-300');
    $(this).find('div').toggleClass('left-1 left-7');
});

$(document).on('click', '#open-add-modal', () => $('#modal-transaction').fadeIn().css('display', 'flex'));
$('.close-modal').click(() => $('#modal-transaction').fadeOut());

$('#form-transaction').submit(async function(e) {
    e.preventDefault();
    const amount = parseFloat($('#tr-amount').val());
    await addDoc(collection(db, "transactions"), {
        uid: currentUser.uid,
        amount: amount,
        description: $('#tr-desc').val(),
        category: $('#tr-category').val(),
        date: new Date()
    });
    $('#modal-transaction').fadeOut();
    this.reset();
});

$(document).on('click', '#logout', () => signOut(auth));
