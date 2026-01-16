import { db, auth } from './firebase-config.js';
import * as AuthMod from './modules/auth.js';
import * as UI from './modules/ui.js';
import * as Mom from './modules/mom.js';
import * as Baby from './modules/baby.js';
import * as Checklist from './modules/checklist.js';
import { vaccineList, babyMilestones, hospitalBagItems, cultureCheck } from './constants.js';

// --- Initialization ---
AuthMod.initAuth(
    (user, userData) => {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-interface').classList.remove('hidden');
        initApp(user, userData);
    },
    () => {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-interface').classList.add('hidden');
    }
);

async function initApp(user, userData) {
    UI.updateHeader(user, userData);
    const { daysUntilDue, currentWeek } = UI.calculatePregnancy(userData.dueDate);

    // Update Header Display
    document.getElementById('header-week').innerText = `Week ${currentWeek}`;
    const daysDisplay = document.getElementById('days-left-display');
    if (daysUntilDue < 0) {
        daysDisplay.innerText = "Overdue";
        daysDisplay.classList.add('text-red-600');
    } else {
        daysDisplay.innerText = `${daysUntilDue} Days`;
    }

    // Initialize all modules
    loadDashboard(user.uid);
    loadMomTab(user.uid);
    loadBabyTab(user.uid);
    loadGuideTab(user.uid);
}

// --- Dashboard / Home ---
async function loadDashboard(uid) {
    const tasks = await new Promise(resolve => Checklist.loadChecklistItems(resolve));
    const userTasks = await new Promise(resolve => Checklist.loadUserTasks(uid, resolve));

    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    let checkedCount = 0;
    let curTri = 0;

    tasks.forEach(t => {
        if (t.trimester !== curTri) {
            curTri = t.trimester;
            const triName = curTri === 4 ? "Post-Birth" : `Trimester ${curTri}`;
            taskList.innerHTML += `<h4 class="text-[10px] font-bold text-red-500 uppercase mt-4 mb-2 tracking-widest border-b pb-1">${triName}</h4>`;
        }

        const isDone = userTasks.includes(t.id);
        if (isDone) checkedCount++;

        const catClass = t.category === 'Medical' ? 'bg-red-100 text-red-600' :
            t.category === 'Admin' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-700';

        const item = document.createElement('label');
        item.className = 'flex justify-between items-center p-3 bg-white border border-slate-50 rounded-xl mb-2';
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="checkbox" class="task-check accent-red-500" data-id="${t.id}" ${isDone ? 'checked' : ''}>
                <span class="text-xs font-bold text-slate-600">${t.task_name}</span>
            </div>
            <span class="text-[9px] font-bold px-2 py-1 rounded ${catClass}">${t.category}</span>
        `;
        taskList.appendChild(item);
    });

    const progress = tasks.length > 0 ? Math.round((checkedCount / tasks.length) * 100) : 0;
    document.getElementById('readiness-display').innerText = `${progress}%`;
    document.getElementById('tasks-fraction').innerText = `${checkedCount}/${tasks.length} Tasks`;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

// --- Mom Tab ---
async function loadMomTab(uid) {
    Mom.loadJournal(uid, (data) => {
        const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
        document.getElementById('last-journal-date').innerText = `Last entry: ${date}`;
    });

    Mom.loadAppointments(uid, (appts) => {
        const list = document.getElementById('appt-list');
        list.innerHTML = appts.length === 0 ? '<div class="text-xs text-slate-400 italic text-center py-2">No appointments.</div>' : '';
        appts.forEach(a => {
            const dateObj = new Date(a.date);
            list.innerHTML += `
                <div class="flex justify-between items-center bg-red-50 p-3 rounded-xl border border-red-100 mb-2">
                    <div>
                        <div class="text-xs font-bold text-slate-700">${a.title}</div>
                        <div class="text-[10px] text-red-500">${dateObj.toLocaleDateString()} @ ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button class="delete-appt text-red-300 hover:text-red-600 px-2" data-id="${a.id}">×</button>
                </div>
            `;
        });
    });

    Mom.loadKicks(uid, (kicks) => {
        const hist = document.getElementById('kick-history');
        hist.innerHTML = '';
        kicks.forEach(k => {
            const date = k.timestamp ? k.timestamp.toDate().toLocaleDateString() : 'Just now';
            hist.innerHTML += `<div class="flex justify-between border-b border-orange-100 py-1"><span class="text-slate-500">${date}</span><span class="font-bold text-orange-500">10 kicks in ${k.duration}</span></div>`;
        });
    });

    Mom.loadWeight(uid, (weights) => {
        const hist = document.getElementById('weight-history');
        hist.innerHTML = '';
        weights.forEach(w => {
            const date = w.date ? w.date.toDate().toLocaleDateString() : 'Just now';
            hist.innerHTML += `<div class="flex justify-between border-b border-slate-100 py-1"><span class="font-bold">${w.weight} kg</span><span class="text-slate-400 text-[9px]">${date}</span></div>`;
        });
    });

    Mom.loadBP(uid, (bps) => {
        const hist = document.getElementById('bp-history');
        hist.innerHTML = '';
        bps.forEach(b => {
            const date = b.date ? b.date.toDate().toLocaleDateString() : '';
            const clr = (b.sys > 140 || b.dia > 90) ? 'text-red-600 font-black' : 'text-slate-700';
            hist.innerHTML += `<div class="flex justify-between items-center py-1"><span class="font-mono text-xs ${clr}">${b.sys}/${b.dia}</span><span class="text-[9px] text-slate-400">${date}</span></div>`;
        });
    });

    Mom.loadContractions(uid, (conts) => {
        const hist = document.getElementById('contraction-history');
        hist.innerHTML = '';
        conts.forEach(c => {
            const time = c.timestamp ? c.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
            hist.innerHTML += `<div class="flex justify-between"><span class="opacity-70">${time}</span><span class="font-bold">${c.duration}</span></div>`;
        });
    });
}

// --- Baby Tab ---
async function loadBabyTab(uid) {
    Baby.loadBabyLogs(uid, (logs) => {
        const list = document.getElementById('baby-log-list');
        list.innerHTML = logs.length === 0 ? '<div class="opacity-50">No activity recorded yet.</div>' : '';
        logs.forEach(l => {
            const time = l.timestamp ? l.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
            let icon = '👶';
            if (l.type.includes('feed')) icon = '🤱';
            if (l.type === 'bottle') icon = '🍼';
            if (l.type === 'diaper') icon = '💩';
            list.innerHTML += `<div class="flex justify-between items-center border-b border-white/10 pb-1"><span>${icon} ${l.type.toUpperCase()}</span><span>${time}</span></div>`;
        });
    });

    const vDones = await new Promise(resolve => Baby.loadVax(uid, resolve));
    const vaxContainer = document.getElementById('vax-container');
    vaxContainer.innerHTML = '';
    vaccineList.forEach(v => {
        const done = vDones.includes(v.id);
        vaxContainer.innerHTML += `<label class="flex justify-between p-2 bg-white rounded-lg border items-center mb-2"><span class="text-xs font-bold">${v.t} <span class="text-[9px] text-slate-400">(${v.age})</span></span><input type="checkbox" class="vax-check" data-id="${v.id}" ${done ? 'checked' : ''}></label>`;
    });

    const mDones = await new Promise(resolve => Baby.loadMilestones(uid, resolve));
    const mContainer = document.getElementById('milestone-container');
    mContainer.innerHTML = '';
    babyMilestones.forEach(m => {
        const done = mDones.includes(m.id);
        mContainer.innerHTML += `<label class="flex justify-between p-2 bg-white rounded-lg border items-center mb-2"><span class="text-xs font-bold">${m.t} <span class="text-[9px] text-slate-400">(${m.age})</span></span><input type="checkbox" class="milestone-check" data-id="${m.id}" ${done ? 'checked' : ''}></label>`;
    });
}

// --- Guide Tab ---
async function loadGuideTab(uid) {
    const bagDones = await new Promise(resolve => Checklist.loadUserBag(uid, resolve));
    renderBagItems(bagDones);
    updateBagProgress(bagDones.length);
}

function renderBagItems(checkedIds, filter = 'all') {
    const list = document.getElementById('bag-list');
    list.innerHTML = '';
    hospitalBagItems.forEach(item => {
        if (filter !== 'all' && item.cat !== filter) return;
        const isChecked = checkedIds.includes(item.id);
        const impBadge = item.imp ? '<span class="text-[9px] text-red-500 font-bold bg-red-50 px-1 rounded ml-2">MUST</span>' : '';
        list.innerHTML += `
            <label class="flex justify-between items-center p-3 bg-white border border-indigo-50 rounded-xl hover:shadow-sm transition cursor-pointer mb-2">
                <div class="flex items-center gap-3">
                    <input type="checkbox" class="bag-check w-4 h-4 rounded border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500 appearance-none transition" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                    <div class="leading-tight"><span class="text-xs font-bold text-slate-700">${item.t}</span>${impBadge}</div>
                </div>
            </label>
        `;
    });
}

function updateBagProgress(count) {
    const percent = hospitalBagItems.length > 0 ? Math.round((count / hospitalBagItems.length) * 100) : 0;
    const badge = document.getElementById('bag-progress');
    badge.innerText = `${percent}% Ready`;
    if (percent === 100) badge.classList.replace('text-indigo-600', 'text-green-600');
}

// --- Global Event Handlers for HTML interop ---
window.switchTab = (tab) => {
    UI.switchTab(tab);
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(b => b.classList.remove('nav-active'));
    // Attempt to find the clicked button if possible, but UI.js handles the switch.
    // We can further refine this by passing the event element or using data-tab.
};

// --- Event Listeners ---
document.addEventListener('click', async (e) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    if (e.target.closest('.nav-btn')) {
        const tab = e.target.closest('.nav-btn').getAttribute('onclick').match(/'([^']+)'/)[1];
        // switchTab is already called by onclick, this listener handles the UI visual feedback
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-active'));
        e.target.closest('.nav-btn').classList.add('nav-active');
    }

    if (e.target.classList.contains('task-check')) {
        await Checklist.toggleTask(uid, e.target.dataset.id, e.target.checked);
        loadDashboard(uid);
    }

    if (e.target.classList.contains('delete-appt')) {
        await Mom.deleteAppointment(e.target.dataset.id);
        loadMomTab(uid);
    }

    if (e.target.classList.contains('vax-check')) {
        await Baby.toggleVax(uid, e.target.dataset.id, e.target.checked);
    }

    if (e.target.classList.contains('milestone-check')) {
        await Baby.toggleMilestone(uid, e.target.dataset.id, e.target.checked);
    }

    if (e.target.classList.contains('bag-check')) {
        await Checklist.toggleBagItem(uid, e.target.dataset.id, e.target.checked);
        const bagDones = await new Promise(resolve => Checklist.loadUserBag(uid, resolve));
        updateBagProgress(bagDones.length);
    }
});

// Expose functions to window for onclicks
window.saveJournal = async () => {
    const txt = document.getElementById('journal-input').value;
    await Mom.saveJournal(auth.currentUser.uid, txt);
    document.getElementById('journal-input').value = '';
    loadMomTab(auth.currentUser.uid);
};

window.saveAppointment = async () => {
    const t = document.getElementById('appt-title').value;
    const d = document.getElementById('appt-date').value;
    await Mom.saveAppointment(auth.currentUser.uid, t, d);
    document.getElementById('appt-modal').style.display = 'none';
    loadMomTab(auth.currentUser.uid);
};

window.finishOnboarding = () => {
    const date = document.getElementById('onboard-date').value;
    if (date) AuthMod.finishOnboarding(date);
};

window.logout = AuthMod.logout;

window.updateProfile = async () => {
    const dueDate = document.getElementById('edit-date').value;
    const budget = document.getElementById('edit-budget').value;
    await db.collection('users').doc(auth.currentUser.uid).update({ dueDate, budget });
    location.reload();
};

window.fixDatabase = async () => {
    if (!confirm("Initialize checklist database?")) return;
    const checklistData = [
        { task_name: "Buka Buku Pink", category: "Medical", trimester: 1 }, { task_name: "Dating Scan", category: "Medical", trimester: 1 },
        { task_name: "Semak Cuti Bersalin", category: "Admin", trimester: 1 }, { task_name: "Detail Scan (20w)", category: "Medical", trimester: 2 },
        { task_name: "Minum Air Gula (MGTT)", category: "Medical", trimester: 2 }, { task_name: "Cari Tukang Urut/Confinement", category: "Admin", trimester: 2 },
        { task_name: "Beli Barang Bayi", category: "Gear", trimester: 2 }, { task_name: "Mula Kira Gerak Bayi", category: "Medical", trimester: 3 },
        { task_name: "Kemas Beg Hospital", category: "Gear", trimester: 3 }, { task_name: "Daftar Kelahiran", category: "Admin", trimester: 4 }
    ];
    const batch = db.batch();
    checklistData.forEach(item => { const ref = db.collection('checklists').doc(); batch.set(ref, item); });
    await batch.commit();
    alert("Database Sedia!");
    location.reload();
};

// Kick Counter Logic
let kCount = 0, kStart = null, kInt;
window.handleKick = async () => {
    if (kCount === 0) {
        kStart = new Date();
        kInt = setInterval(() => {
            const diff = Math.floor((new Date() - kStart) / 1000);
            document.getElementById('kick-timer').innerText = new Date(diff * 1000).toISOString().substr(11, 8);
        }, 1000);
    }
    kCount++;
    document.getElementById('kick-count').innerText = kCount;
    if (kCount >= 10) {
        clearInterval(kInt);
        await Mom.saveKickSession(auth.currentUser.uid, document.getElementById('kick-timer').innerText);
        alert("10 Kicks Recorded!");
        resetKick();
        loadMomTab(auth.currentUser.uid);
    }
};

function resetKick() {
    clearInterval(kInt);
    kCount = 0;
    document.getElementById('kick-count').innerText = 0;
    document.getElementById('kick-timer').innerText = "00:00:00";
}
window.resetKick = resetKick;

// Weight & BP
document.getElementById('save-weight')?.addEventListener('click', async () => {
    const w = document.getElementById('weight-in').value;
    if (w) {
        await Mom.saveWeight(auth.currentUser.uid, w);
        document.getElementById('weight-in').value = '';
        loadMomTab(auth.currentUser.uid);
    }
});

document.getElementById('save-bp')?.addEventListener('click', async () => {
    const sys = document.getElementById('bp-sys').value;
    const dia = document.getElementById('bp-dia').value;
    if (sys && dia) {
        await Mom.saveBP(auth.currentUser.uid, sys, dia);
        document.getElementById('bp-sys').value = '';
        document.getElementById('bp-dia').value = '';
        loadMomTab(auth.currentUser.uid);
    }
});

// Baby Activity
document.querySelectorAll('.baby-act-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        await Baby.saveBabyLog(auth.currentUser.uid, btn.dataset.type);
        loadBabyTab(auth.currentUser.uid);
    });
});

// Culture/Confinement
document.querySelectorAll('.cul-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const c = btn.dataset.cul;
        const list = document.getElementById('confinement-list');
        list.innerHTML = '';
        cultureCheck[c].forEach(x => {
            list.innerHTML += `<li>✨ ${x}</li>`;
        });
        document.querySelectorAll('.cul-btn').forEach(b => b.classList.remove('bg-red-500', 'text-white'));
        btn.classList.add('bg-red-500', 'text-white');
    });
});
