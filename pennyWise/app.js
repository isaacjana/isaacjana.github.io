// PennyWise Pro - app.js
// Sarawak Budget Planner 2026 Context

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBjemuEa89QZI68Ttv5iW9DjQMhLwU9Kmk",
    authDomain: "penny-wise-bfdaa.firebaseapp.com",
    projectId: "penny-wise-bfdaa",
    storageBucket: "penny-wise-bfdaa.firebasestorage.app",
    messagingSenderId: "438298356973",
    appId: "1:438298356973:web:2b13a22ec61db8a34cb0e4"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- STATE MANAGEMENT ---
let currentUser = null;
let currentMonth = new Date().getMonth(); // 0-11
let currentYear = new Date().getFullYear();

let state = {
    grossSalary: 0,
    netSalary: 0,
    budget: {
        needs: 50,
        wants: 30,
        savings: 20
    },
    expenses: [],
    goals: []
};

let budgetChart = null;
let selectedCategory = null;
let selectedIcon = 'fa-tag';
let unsubscribeBudget = null;
let unsubscribeExpenses = null;
let unsubscribeGoals = null;

// --- UTILITIES ---
const getPeriodKey = () => `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;

const getPeriodLabel = () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[currentMonth]} ${currentYear}`;
};
const formatRM = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

// --- LOGIC: INCOME CALCULATION ---
/**
 * STRICT 2026 Statutory Rules as per Mission:
 * EPF: 11% (No Cap)
 * SOCSO: 0.5%, Capped at RM6k Gross (Max ~RM29.75)
 * EIS: 0.2%, Capped at RM6k Gross (Max ~RM11.90)
 * PCB: 0% if <3.5k, 2% if 3.5k-6k
 */
function calculateNetIncome(gross) {
    if (!gross || gross <= 0) return { net: 0, deductions: {} };

    // EPF
    const epf = gross * 0.11;

    // SOCSO (Capped at 6000 wage ceiling)
    const socsoBasis = Math.min(gross, 6000);
    const socso = socsoBasis * 0.005; // User said max ~29.75. 6000 * 0.005 is 30.00. 
    // Usually table based, but user specifically asked for RM29.75 cap.
    const finalSocso = Math.min(socso, 29.75);

    // EIS (Capped at 6000 wage ceiling)
    const eisBasis = Math.min(gross, 6000);
    const eis = eisBasis * 0.002; // 6000 * 0.002 = 12.00.
    const finalEis = Math.min(eis, 11.90);

    // PCB PCB Estimator: Simple logic (0% if <RM3.5k, 2% if RM3.5k-6k)
    let pcb = 0;
    if (gross >= 3500) {
        pcb = gross * 0.02;
    }

    const totalDeductions = epf + finalSocso + finalEis + pcb;
    const net = gross - totalDeductions;

    return {
        net,
        totalDeductions,
        breakdown: { epf, socso: finalSocso, eis: finalEis, pcb }
    };
}

// --- CORE UI UPDATES ---
function updateUI() {
    // Ensure grossSalary is a valid number
    const gross = parseFloat(state.grossSalary) || 0;

    // 1. Calculate Deductions & Net
    const result = calculateNetIncome(gross);
    state.netSalary = parseFloat(result.net) || 0;

    // Update Income Section
    $('#total-deductions').text('RM ' + formatRM(result.totalDeductions || 0));
    $('#net-salary').text('RM ' + formatRM(state.netSalary));

    if (gross > 0) {
        const b = result.breakdown;
        $('#statutory-breakdown').html(`
            <span class="bg-red-50 text-red-700 px-2 py-1 rounded-md text-[9px]">KWSP: RM ${formatRM(b.epf)}</span>
            <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[9px]">SOCSO: RM ${formatRM(b.socso)}</span>
            <span class="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-[9px]">EIS: RM ${formatRM(b.eis)}</span>
            <span class="bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-[9px]">PCB: RM ${formatRM(b.pcb)}</span>
        `);
    } else {
        $('#statutory-breakdown').empty();
    }

    // 2. Budget Allocations
    const needsBudget = state.netSalary * ((parseFloat(state.budget.needs) || 0) / 100);
    const wantsBudget = state.netSalary * ((parseFloat(state.budget.wants) || 0) / 100);
    const savingsBudget = state.netSalary * ((parseFloat(state.budget.savings) || 0) / 100);

    $('#needs-amount').text('RM ' + formatRM(needsBudget));
    $('#wants-amount').text('RM ' + formatRM(wantsBudget));
    $('#savings-amount').text('RM ' + formatRM(savingsBudget));

    // 3. Spending Progress
    const needsSpent = state.expenses.filter(e => e.category === 'Needs').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const wantsSpent = state.expenses.filter(e => e.category === 'Wants').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    $('#needs-spending-stat').text(`RM ${formatRM(needsSpent)} / RM ${formatRM(needsBudget)}`);
    $('#wants-spending-stat').text(`RM ${formatRM(wantsSpent)} / RM ${formatRM(wantsBudget)}`);

    // Progress Bars
    const needsPerc = needsBudget > 0 ? (needsSpent / needsBudget) * 100 : 0;
    const wantsPerc = wantsBudget > 0 ? (wantsSpent / wantsBudget) * 100 : 0;

    $('#needs-progress-bar').css('width', Math.min(needsPerc, 100) + '%');
    $('#wants-progress-bar').css('width', Math.min(wantsPerc, 100) + '%');

    // Visual Feedback: Coral Red if "Wants" exceeds budget
    if (wantsPerc > 100) {
        $('#wants-progress-bar').removeClass('bg-emerald-500').addClass('bg-red-500');
    } else {
        $('#wants-progress-bar').removeClass('bg-red-500').addClass('bg-emerald-500');
    }

    // 4. Remaining Balance
    const totalSpent = state.expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const remainingVal = state.netSalary - totalSpent;
    $('#total-balance').text(formatRM(remainingVal));

    // 5. Update Donut Chart
    updateChart();

    // 6. Update Expense List (Last 5)
    renderExpenseList();

    // 7. Update Goals
    renderGoalsList();

    // 8. Financial Health Score
    updateHealthScore();
}

function updateHealthScore() {
    // Score based on Savings Target vs Actual Spendable Baki
    const totalSpent = state.expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const savingsTarget = state.netSalary * (state.budget.savings / 100);
    const actualSavings = state.netSalary - totalSpent;

    let score = 0;
    if (state.netSalary > 0) {
        score = Math.min(Math.round((actualSavings / (savingsTarget || 1)) * 100), 100);
    }
    if (score < 0) score = 0;

    $('#health-score-number').text(score + '%');

    // Circular progress
    const offset = 176 - (176 * score / 100);
    $('#health-score-circle').css('stroke-dashoffset', offset);

    // Dynamic Text
    let statusText = "Steady Gidup!";
    let statusMsg = "Your budget is looking healthy.";
    if (score > 90) {
        statusText = "Sangat Power!";
        statusMsg = "You are a Sarawak Savings Pro!";
    } else if (score < 50) {
        statusText = "Kacak-Kacak Sik?";
        statusMsg = "Careful, you're dipping into savings.";
        $('#health-score-circle').removeClass('text-emerald-500').addClass('text-red-500');
    } else {
        $('#health-score-circle').removeClass('text-red-500').addClass('text-emerald-500');
    }

    $('#health-score-text').text(statusText);
    $('#health-score-text').next('p').text(statusMsg);
}

function renderGoalsList() {
    const list = $('#goals-list');
    list.empty();

    if (state.goals.length === 0) {
        list.append('<div class="text-center py-4 border-2 border-dashed border-gray-100 rounded-2xl"><p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No goals set yet</p></div>');
        return;
    }

    state.goals.forEach(goal => {
        const perc = Math.min((goal.current / goal.target) * 100, 100);
        list.append(`
            <div class="space-y-2">
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-xs font-bold text-gray-800">${goal.name}</p>
                        <p class="text-[10px] text-gray-400">Target: RM ${formatRM(goal.target)}</p>
                    </div>
                    <p class="text-[10px] font-bold text-jungle-700">RM ${formatRM(goal.current)}</p>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-jungle-500 h-full rounded-full transition-all duration-1000" style="width: ${perc}%"></div>
                </div>
            </div>
        `);
    });
}

function updateChart() {
    const data = [
        parseFloat(state.budget.needs) || 0,
        parseFloat(state.budget.wants) || 0,
        parseFloat(state.budget.savings) || 0
    ];

    if (!budgetChart) {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        budgetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Needs', 'Wants', 'Savings'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#3b82f6', '#f97316', '#10b981'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        budgetChart.data.datasets[0].data = data;
        budgetChart.update();
    }
}

function renderExpenseList() {
    const list = $('#expenses-list');
    list.empty();

    if (state.expenses.length === 0) {
        list.append(`
            <div class="flex items-center justify-center h-full text-gray-300 italic text-sm py-4">
                Belum ada rekaman makan-makan...
            </div>
        `);
        return;
    }

    // Show last 5
    const latest = [...state.expenses].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    latest.forEach(exp => {
        const icon = exp.icon || (exp.category === 'Needs' ? 'fa-house-chimney' : 'fa-utensils');
        const color = exp.category === 'Needs' ? 'text-blue-500' : 'text-orange-500';

        list.append(`
            <div class="flex items-center justify-between p-3 bg-white border border-gray-50 rounded-2xl shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <i class="fa-solid ${icon} ${color}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-gray-800 text-sm capitalize">${exp.name}</p>
                        <p class="text-[10px] text-gray-400 capitalize">${new Date(exp.timestamp).toLocaleDateString()} • ${exp.category}</p>
                    </div>
                </div>
                <p class="font-bold text-gray-700">-RM ${formatRM(exp.amount)}</p>
            </div>
        `);
    });
}

// --- DATA PERSISTENCE (FIRESTORE) ---
function initDataSync() {
    if (!currentUser) return;

    const period = getPeriodKey();
    $('#current-period-label').text(getPeriodLabel());

    // Unsubscribe from previous listeners if any
    if (unsubscribeBudget) unsubscribeBudget();
    if (unsubscribeExpenses) unsubscribeExpenses();
    if (unsubscribeGoals) unsubscribeGoals();

    const userDocRef = db.collection('users').doc(currentUser.uid);

    // Listen to Budget Settings (Specific to User and Period)
    unsubscribeBudget = userDocRef.collection('settings').doc(period).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.grossSalary = data.grossSalary || 0;
            state.budget = data.budget || { needs: 50, wants: 30, savings: 20 };

            // Sync inputs with state (only if not focused to avoid cursor jumping)
            if (!$('#gross-salary').is(':focus')) $('#gross-salary').val(state.grossSalary || '');
            if (!$('#slider-needs').is(':focus')) $('#slider-needs').val(state.budget.needs);
            if (!$('#slider-wants').is(':focus')) $('#slider-wants').val(state.budget.wants);
            if (!$('#slider-savings').is(':focus')) $('#slider-savings').val(state.budget.savings);

            updateLabels();
            updateUI();
        } else {
            // Initial setup for new month - fallback to last known or 50/30/20
            userDocRef.collection('settings').doc(period).set({
                grossSalary: state.grossSalary || 0,
                budget: state.budget || { needs: 50, wants: 30, savings: 20 }
            });
        }
    });

    // Listen to Expenses (Specific to Period)
    unsubscribeExpenses = userDocRef.collection('expenses')
        .where('period', '==', period)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .onSnapshot((snapshot) => {
            state.expenses = [];
            snapshot.forEach(doc => {
                state.expenses.push({ id: doc.id, ...doc.data() });
            });
            updateUI();
        });

    // Listen to Goals (Goals are persistent across months)
    unsubscribeGoals = userDocRef.collection('goals').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
        state.goals = [];
        snapshot.forEach(doc => {
            state.goals.push({ id: doc.id, ...doc.data() });
        });
        updateUI();
    });
}

function updateBudgetFirestore() {
    if (!currentUser) return;
    const period = getPeriodKey();
    db.collection('users').doc(currentUser.uid).collection('settings').doc(period).set({
        grossSalary: state.grossSalary,
        budget: state.budget
    }, { merge: true });
}

function updateLabels() {
    $('#needs-val').text(Math.round(state.budget.needs) + '%');
    $('#wants-val').text(Math.round(state.budget.wants) + '%');
    $('#savings-val').text(Math.round(state.budget.savings) + '%');
}

// --- AUTH LOGIC ---
function handleAuthStatus() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            $('#login-overlay').addClass('hidden');
            $('#user-name').text(user.displayName.split(' ')[0]);
            if (user.photoURL) {
                $('#user-photo').attr('src', user.photoURL).removeClass('hidden');
                $('#user-icon').addClass('hidden');
            }
            initDataSync();
        } else {
            currentUser = null;
            $('#login-overlay').removeClass('hidden');
            $('#user-photo').addClass('hidden');
            $('#user-icon').removeClass('hidden');
            if (unsubscribeBudget) unsubscribeBudget();
            if (unsubscribeExpenses) unsubscribeExpenses();
            // Reset local state
            state.expenses = [];
            state.grossSalary = 0;
            updateUI();
        }
    });
}

// --- EVENT HANDLERS ---
$(document).ready(function () {

    handleAuthStatus();

    // Login / Logout
    $('#btn-login').on('click', () => {
        auth.signInWithPopup(provider).catch(err => alert("Login failed: " + err.message));
    });

    $('#btn-logout').on('click', () => {
        auth.signOut();
    });

    // Month Navigation
    $('#prev-month').on('click', () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        initDataSync();
    });

    $('#next-month').on('click', () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        initDataSync();
    });

    // Gross Salary Input
    $('#gross-salary').on('input', function () {
        state.grossSalary = parseFloat($(this).val()) || 0;
        updateUI();
    });

    // Debounce Firestore Update for Salary
    let salaryTimeout;
    $('#gross-salary').on('change', function () {
        clearTimeout(salaryTimeout);
        salaryTimeout = setTimeout(() => {
            updateBudgetFirestore();
        }, 1000);
    });

    // Sliders with auto-balancing logic
    $('input[type="range"]').on('input', function () {
        const id = $(this).attr('id');
        const newVal = parseInt($(this).val());

        const keys = ['needs', 'wants', 'savings'];
        const changedKey = id.split('-')[1]; // needs, wants, or savings
        const otherKeys = keys.filter(k => k !== changedKey);

        // Calculate remaining to be distributed
        const remaining = 100 - newVal;
        const currentOthersSum = state.budget[otherKeys[0]] + state.budget[otherKeys[1]];

        if (currentOthersSum === 0) {
            // Split equally if both others are 0
            state.budget[otherKeys[0]] = remaining / 2;
            state.budget[otherKeys[1]] = remaining / 2;
        } else {
            // Distribute proportionally
            state.budget[otherKeys[0]] = (state.budget[otherKeys[0]] / currentOthersSum) * remaining;
            state.budget[otherKeys[1]] = (state.budget[otherKeys[1]] / currentOthersSum) * remaining;
        }

        state.budget[changedKey] = newVal;

        // Sync inputs
        $('#slider-needs').val(state.budget.needs);
        $('#slider-wants').val(state.budget.wants);
        $('#slider-savings').val(state.budget.savings);

        updateLabels();
        updateUI();
    });

    $('input[type="range"]').on('change', function () {
        updateBudgetFirestore();
    });

    // Quick Add Modal
    $('#quick-add-trigger').on('click', function () {
        $('#modal-backdrop').removeClass('hidden');
        setTimeout(() => {
            $('#modal-content').removeClass('translate-y-full');
        }, 10);
    });

    const closeModal = () => {
        $('#modal-content').addClass('translate-y-full');
        setTimeout(() => {
            $('#modal-backdrop').addClass('hidden');
        }, 300);
    };

    $('#modal-close, #modal-backdrop').on('click', function (e) {
        if (e.target === this) closeModal();
    });

    // Category Selection
    $('.cat-btn').on('click', function () {
        $('.cat-btn').removeClass('border-jungle-500 bg-jungle-50 text-jungle-700').addClass('border-gray-100');
        $(this).removeClass('border-gray-100').addClass('border-jungle-500 bg-jungle-50 text-jungle-700');
        selectedCategory = $(this).data('cat');
        selectedIcon = $(this).data('icon');
        checkSaveStatus();
    });

    // Add Goal
    $('#btn-add-goal').on('click', async function () {
        if (!currentUser) return;
        const name = prompt("Matlamat Tabung (e.g. Dream Phone, Trip Mulu):");
        if (!name) return;
        const targetStr = prompt("Berapa Target RM?");
        const target = parseFloat(targetStr);
        if (isNaN(target) || target <= 0) {
            alert("Sila masukkan jumlah yang sah.");
            return;
        }

        try {
            await db.collection('users').doc(currentUser.uid).collection('goals').add({
                name,
                target,
                current: 0,
                timestamp: Date.now()
            });
        } catch (e) {
            console.error(e);
        }
    });

    // Save Expense
    const checkSaveStatus = () => {
        const amount = parseFloat($('#exp-amount').val()) || 0;
        const name = $('#exp-name').val().trim();
        $('#save-expense').prop('disabled', !(amount > 0 && selectedCategory && name));
    };

    $('#exp-amount, #exp-name').on('input', checkSaveStatus);

    $('#save-expense').on('click', async function () {
        if (!currentUser) return;
        const amount = parseFloat($('#exp-amount').val());
        const name = $('#exp-name').val();

        const btn = $(this);
        btn.prop('disabled', true).text('Menyimpan...');

        try {
            await db.collection('users').doc(currentUser.uid).collection('expenses').add({
                name,
                amount,
                category: selectedCategory,
                icon: selectedIcon,
                period: getPeriodKey(),
                timestamp: Date.now()
            });

            // Check if it's a "Savings" type (optional logic for auto-funding goals could be here)

            // Reset & Close
            $('#exp-amount').val('');
            $('#exp-name').val('');
            $('.cat-btn').removeClass('border-jungle-500 bg-jungle-50 text-jungle-700').addClass('border-gray-100');
            selectedCategory = null;
            selectedIcon = 'fa-tag';
            closeModal();
        } catch (error) {
            console.error("Error adding expense: ", error);
            alert("Gagal simpan rekaman. Cuba lagi!");
        } finally {
            btn.prop('disabled', false).text('Simpan Belanja');
        }
    });

});
