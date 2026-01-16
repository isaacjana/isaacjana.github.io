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
let state = {
    grossSalary: 0,
    netSalary: 0,
    budget: {
        needs: 50,
        wants: 30,
        savings: 20
    },
    expenses: []
};

let budgetChart = null;
let selectedCategory = null;
let unsubscribeBudget = null;
let unsubscribeExpenses = null;

// --- UTILITIES ---
const formatRM = (amount) => {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
    }).format(amount).replace('MYR', 'RM');
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
    // 1. Calculate Deductions & Net
    const result = calculateNetIncome(state.grossSalary);
    state.netSalary = result.net;

    // Update Income Section
    $('#total-deductions').text(formatRM(result.totalDeductions));
    $('#net-salary').text(formatRM(result.netSalary));

    if (state.grossSalary > 0) {
        const b = result.breakdown;
        $('#statutory-breakdown').html(`
            <span>EPF (11%): ${formatRM(b.epf)}</span>
            <span>SOCSO: ${formatRM(b.socso)}</span>
            <span>EIS: ${formatRM(b.eis)}</span>
            <span>PCB (2%): ${formatRM(b.pcb)}</span>
        `);
    } else {
        $('#statutory-breakdown').empty();
    }

    // 2. Budget Allocations
    const needsBudget = state.netSalary * (state.budget.needs / 100);
    const wantsBudget = state.netSalary * (state.budget.wants / 100);
    const savingsBudget = state.netSalary * (state.budget.savings / 100);

    $('#needs-amount').text(formatRM(needsBudget));
    $('#wants-amount').text(formatRM(wantsBudget));
    $('#savings-amount').text(formatRM(savingsBudget));

    // 3. Spending Progress
    const needsSpent = state.expenses.filter(e => e.category === 'Needs').reduce((acc, curr) => acc + curr.amount, 0);
    const wantsSpent = state.expenses.filter(e => e.category === 'Wants').reduce((acc, curr) => acc + curr.amount, 0);

    $('#needs-spending-stat').text(`${formatRM(needsSpent)} / ${formatRM(needsBudget)}`);
    $('#wants-spending-stat').text(`${formatRM(wantsSpent)} / ${formatRM(wantsBudget)}`);

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
    const totalSpent = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingVal = state.netSalary - totalSpent;
    $('#total-balance').text(formatRM(remainingVal));

    // 5. Update Donut Chart
    updateChart();

    // 6. Update Expense List (Last 5)
    renderExpenseList();
}

function updateChart() {
    const data = [state.budget.needs, state.budget.wants, state.budget.savings];

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
        const icon = exp.category === 'Needs' ? 'fa-house-chimney text-blue-500' : 'fa-utensils text-orange-500';
        list.append(`
            <div class="flex items-center justify-between p-3 bg-white border border-gray-50 rounded-2xl shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-gray-800 text-sm">${exp.name}</p>
                        <p class="text-[10px] text-gray-400 capitalize">${new Date(exp.timestamp).toLocaleDateString()} • ${exp.category}</p>
                    </div>
                </div>
                <p class="font-bold text-gray-700">-${formatRM(exp.amount)}</p>
            </div>
        `);
    });
}

// --- DATA PERSISTENCE (FIRESTORE) ---
function initDataSync() {
    if (!currentUser) return;

    // Unsubscribe from previous listeners if any
    if (unsubscribeBudget) unsubscribeBudget();
    if (unsubscribeExpenses) unsubscribeExpenses();

    const userDocRef = db.collection('users').doc(currentUser.uid);

    // Listen to Budget Settings (Specific to User)
    unsubscribeBudget = userDocRef.collection('settings').doc('currentMonth').onSnapshot((doc) => {
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
            // Initial setup for new user
            userDocRef.collection('settings').doc('currentMonth').set({
                grossSalary: 0,
                budget: { needs: 50, wants: 30, savings: 20 }
            });
        }
    });

    // Listen to Expenses (Specific to User)
    unsubscribeExpenses = userDocRef.collection('expenses').orderBy('timestamp', 'desc').limit(20).onSnapshot((snapshot) => {
        state.expenses = [];
        snapshot.forEach(doc => {
            state.expenses.push({ id: doc.id, ...doc.data() });
        });
        updateUI();
    });
}

function updateBudgetFirestore() {
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).collection('settings').doc('currentMonth').update({
        grossSalary: state.grossSalary,
        budget: state.budget
    });
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
        checkSaveStatus();
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
                timestamp: Date.now()
            });

            // Reset & Close
            $('#exp-amount').val('');
            $('#exp-name').val('');
            $('.cat-btn').removeClass('border-jungle-500 bg-jungle-50 text-jungle-700').addClass('border-gray-100');
            selectedCategory = null;
            closeModal();
        } catch (error) {
            console.error("Error adding expense: ", error);
            alert("Gagal simpan rekaman. Cuba lagi!");
        } finally {
            btn.prop('disabled', false).text('Simpan Belanja');
        }
    });

});
