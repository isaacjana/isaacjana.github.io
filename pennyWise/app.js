import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, getDocs, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsGbfRlXxqUwLHXbGcwRYOvuygTPgTeMA",
  authDomain: "penny-wise-e482e.firebaseapp.com",
  projectId: "penny-wise-e482e",
  storageBucket: "penny-wise-e482e.firebasestorage.app",
  messagingSenderId: "504425521894",
  appId: "1:504425521894:web:d3bf53689eaf6a3d5e9127",
  measurementId: "G-SXRNXF6V30"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let currentUser = null;

enableIndexedDbPersistence(db).catch(() => {});

const applyTheme = () => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};
applyTheme();

$('#btn-login').click(() => signInWithPopup(auth, provider));
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

$(document).on('click', '.nav-link', function() {
    $('.nav-link').removeClass('nav-active text-indigo-600').addClass('text-slate-400');
    $(this).addClass('nav-active text-indigo-600');
    loadScreen($(this).data('screen'));
});

function loadScreen(screen) {
    const container = $('#screen-container');
    container.fadeOut(100, () => {
        if (screen === 'dashboard') renderDashboard();
        if (screen === 'transactions') renderTransactions();
        if (screen === 'reports') renderReports();
        if (screen === 'settings') renderSettings();
        container.fadeIn(100);
    });
}

function renderDashboard() {
    const goal = localStorage.getItem('budget_goal') || 5000;
    $('#screen-container').html(`
        <div class="mb-8">
            <h1 class="text-3xl font-black">Dashboard</h1>
            <p class="text-slate-400">Monthly Goal: $${goal}</p>
        </div>
        <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl mb-8">
            <p class="opacity-70 text-sm">Spent so far</p>
            <h2 id="dash-spent" class="text-5xl font-black mt-1">$0.00</h2>
            <div class="mt-8 bg-white/20 h-2 rounded-full overflow-hidden">
                <div id="pace-bar" class="bg-white h-full transition-all duration-1000" style="width: 0%"></div>
            </div>
        </div>
        <h3 class="font-bold text-lg mb-4">Recent History</h3>
        <div id="recent-list" class="space-y-3"></div>
    `);
    syncData();
}

function syncData() {
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
    onSnapshot(q, (snap) => {
        let spent = 0;
        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            spent += t.amount;
            html += `
                <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center shadow-sm border dark:border-slate-800">
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl">💰</div>
                        <div><p class="font-bold">${t.description}</p><p class="text-xs text-slate-400">${t.category}</p></div>
                    </div>
                    <p class="font-black text-slate-900 dark:text-white">-$${t.amount.toFixed(2)}</p>
                </div>`;
        });
        const goal = parseFloat(localStorage.getItem('budget_goal') || 5000);
        $('#dash-spent').text(`$${spent.toFixed(2)}`);
        $('#pace-bar').css('width', Math.min((spent / goal) * 100, 100) + '%');
        $('#recent-list').html(html || '<p class="text-center text-slate-400 py-10">No data yet</p>');
    });
}

async function renderReports() {
    $('#screen-container').html(`
        <h1 class="text-2xl font-black mb-6">Insights</h1>
        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm mb-6 border dark:border-slate-800 flex justify-center">
            <canvas id="insightChart" class="max-h-64"></canvas>
        </div>
    `);
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));
    const snap = await getDocs(q);
    const aggr = {};
    snap.forEach(d => { aggr[d.data().category] = (aggr[d.data().category] || 0) + d.data().amount; });

    new Chart(document.getElementById('insightChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(aggr),
            datasets: [{ data: Object.values(aggr), backgroundColor: ['#4f46e5', '#f59e0b', '#ef4444', '#10b981'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '80%' }
    });
}

function renderSettings() {
    const goal = localStorage.getItem('budget_goal') || 5000;
    const isDark = document.documentElement.classList.contains('dark');
    $('#screen-container').html(`
        <h1 class="text-2xl font-black mb-8">Settings</h1>
        <div class="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] space-y-6 shadow-sm border dark:border-slate-800">
            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase">Monthly Budget</label>
                <div class="flex space-x-2 mt-2">
                    <input id="set-goal" type="number" value="${goal}" class="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border-none font-bold">
                    <button id="save-budget" class="bg-indigo-600 text-white px-6 rounded-xl font-bold">Save</button>
                </div>
            </div>
            <div class="flex justify-between items-center py-2">
                <span class="font-bold">Dark Mode</span>
                <button id="toggle-theme" class="w-12 h-6 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-200'} relative">
                    <div class="absolute top-1 ${isDark ? 'left-7' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all"></div>
                </button>
            </div>
            <button id="export-csv" class="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold">Export Activity (CSV)</button>
            <button id="logout" class="w-full text-left p-4 text-red-500 font-bold">Sign Out</button>
        </div>
    `);
}

$(document).on('click', '#toggle-theme', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    loadScreen('settings');
});

$(document).on('click', '#save-budget', () => {
    localStorage.setItem('budget_goal', $('#set-goal').val());
    alert('Budget goal updated');
});

$(document).on('click', '#logout', () => signOut(auth));
$(document).on('click', '#open-add-modal', () => $('#modal-transaction').fadeIn().css('display', 'flex'));
$('.close-modal').click(() => $('#modal-transaction').fadeOut());

$('#form-transaction').submit(async function(e) {
    e.preventDefault();
    await addDoc(collection(db, "transactions"), {
        uid: currentUser.uid,
        amount: parseFloat($('#tr-amount').val()),
        description: $('#tr-desc').val(),
        category: $('#tr-category').val(),
        date: new Date()
    });
    $('#modal-transaction').fadeOut();
    this.reset();
});

$(document).on('click', '#export-csv', async () => {
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));
    const snap = await getDocs(q);
    let csv = "Date,Description,Category,Amount\n";
    snap.forEach(d => { const t = d.data(); csv += `${t.date.toDate().toLocaleDateString()},"${t.description}",${t.category},${t.amount}\n`; });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'PennyWise_Export.csv'; a.click();
});
