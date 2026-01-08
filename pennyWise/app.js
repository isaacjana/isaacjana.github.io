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

// Dark Mode Controller
const applyDarkMode = () => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
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
    const goal = localStorage.getItem('budget_goal') || 5000;
    $('#screen-container').html(`
        <div class="mb-8">
            <h1 class="text-3xl font-black">Dashboard</h1>
            <p class="text-slate-500 font-bold text-sm">Target: $${goal}</p>
        </div>
        <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl mb-10 relative overflow-hidden">
            <p class="opacity-60 text-xs font-bold uppercase tracking-widest">Spent this month</p>
            <h2 id="dash-spent" class="text-5xl font-black mt-2 tracking-tighter">$0.00</h2>
            <div class="mt-8 bg-white/20 h-2 rounded-full overflow-hidden">
                <div id="pace-bar" class="bg-white h-full transition-all duration-1000" style="width: 0%"></div>
            </div>
        </div>
        <h3 class="font-bold text-lg mb-4 text-slate-400">Recent Activity</h3>
        <div id="recent-list" class="space-y-3 pb-20"></div>
    `);
    syncData();
}

function renderTransactions() {
    $('#screen-container').html(`
        <h1 class="text-3xl font-black mb-8">History</h1>
        <div id="trans-list" class="space-y-3 pb-20"></div>
    `);
    syncData();
}

function syncData() {
    if (!currentUser) return;
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
    
    onSnapshot(q, (snap) => {
        let total = 0;
        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            total += t.amount;
            html += `
                <div class="bg-white dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-slate-200 dark:border-white/5 shadow-sm">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">💰</div>
                        <div>
                            <p class="font-bold">${t.description}</p>
                            <p class="text-xs text-slate-500">${t.category}</p>
                        </div>
                    </div>
                    <p class="font-black text-red-500">-$${t.amount.toFixed(2)}</p>
                </div>`;
        });
        const goal = parseFloat(localStorage.getItem('budget_goal') || 5000);
        $('#dash-spent').text(`$${total.toFixed(2)}`);
        $('#pace-bar').css('width', Math.min((total / goal) * 100, 100) + '%');
        $('#recent-list, #trans-list').html(html || '<p class="text-center text-slate-500 py-20">No data logged yet.</p>');
    });
}

async function renderReports() {
    $('#screen-container').html(`
        <h1 class="text-3xl font-black mb-8">Insights</h1>
        <div class="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 mb-6 flex justify-center">
            <canvas id="insightChart" class="max-h-64"></canvas>
        </div>
        <div id="category-legend" class="grid grid-cols-2 gap-4 pb-20"></div>
    `);
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));
    const snap = await getDocs(q);
    const data = {};
    snap.forEach(d => { const t = d.data(); data[t.category] = (data[t.category] || 0) + t.amount; });

    const colors = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#64748b'];
    
    new Chart(document.getElementById('insightChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{ 
                data: Object.values(data), 
                backgroundColor: colors, 
                borderWidth: 0 
            }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '80%' }
    });

    let legendHtml = '';
    Object.keys(data).forEach((cat, i) => {
        legendHtml += `
            <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full" style="background:${colors[i % colors.length]}"></div>
                <div class="text-xs"><span class="font-bold">${cat}</span>: $${data[cat].toFixed(0)}</div>
            </div>`;
    });
    $('#category-legend').html(legendHtml);
}

function renderSettings() {
    const goal = localStorage.getItem('budget_goal') || 5000;
    const isDark = document.documentElement.classList.contains('dark');
    $('#screen-container').html(`
        <h1 class="text-3xl font-black mb-8">Settings</h1>
        <div class="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-8">
            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Budget Limit</label>
                <div class="flex space-x-2 mt-2">
                    <input id="set-goal" type="number" value="${goal}" class="flex-1 bg-slate-100 dark:bg-white/5 p-4 rounded-xl border-none font-bold outline-none">
                    <button id="save-budget" class="bg-indigo-600 text-white px-6 rounded-xl font-bold">Save</button>
                </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/5">
                <span class="font-bold">Dark Mode</span>
                <button id="toggle-theme" class="w-12 h-6 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-300'} relative transition-colors">
                    <div class="absolute top-1 ${isDark ? 'left-7' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all"></div>
                </button>
            </div>
            <div class="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <button id="export-csv" class="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-xl font-bold text-left flex justify-between">Export Data <i class="fas fa-download opacity-30"></i></button>
                <button id="logout" class="w-full p-4 bg-red-500/10 text-red-500 rounded-xl font-bold">Sign Out</button>
            </div>
        </div>
    `);
}

// Global Event Listeners
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
    } finally {
        btn.prop('disabled', false).text('Save Transaction');
    }
});

$(document).on('click', '#save-budget', () => {
    localStorage.setItem('budget_goal', $('#set-goal').val());
    alert('Settings saved.');
    loadScreen('dashboard');
});

$(document).on('click', '#export-csv', async () => {
    if (!currentUser) return;
    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));
    const snap = await getDocs(q);
    let csv = "Date,Description,Category,Amount\n";
    snap.forEach(d => { 
        const t = d.data(); 
        const date = t.date ? t.date.toDate().toLocaleDateString() : '';
        csv += `${date},"${t.description}",${t.category},${t.amount}\n`; 
    });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'PennyWise_Export.csv'; 
    a.click();
});

$(document).on('click', '#logout', () => signOut(auth));
