<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Daily Burn Ultimate</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0f172a">

    <style>
        /* Smooth Animations */
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        
        /* Logic Styles */
        .completed { opacity: 0.5; filter: grayscale(90%); pointer-events: none; }
        .completed .check-btn { background: #10b981; border-color: #10b981; color: white; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

        /* Modal Backdrop */
        .modal-backdrop { background-color: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); }
    </style>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen font-sans select-none pb-20">

    <div class="fixed top-0 w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 z-40 p-3 flex justify-between items-center max-w-md left-0 right-0 mx-auto">
        <div class="flex items-center space-x-2 text-orange-500">
            <i class="fas fa-fire animate-pulse"></i>
            <span class="font-bold text-lg" id="streak-display">0</span>
            <span class="text-xs text-slate-500 uppercase tracking-widest">Day Streak</span>
        </div>
        <button id="open-settings" class="text-slate-400 hover:text-white transition">
            <i class="fas fa-cog text-xl"></i>
        </button>
    </div>

    <div class="w-full max-w-md mx-auto mt-16 p-4">
        
        <div class="mb-6 flex justify-between items-end">
            <div>
                <h1 class="text-2xl font-bold text-white">Today's Plan</h1>
                <p class="text-xs text-slate-400" id="date-display">Loading...</p>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-emerald-400" id="cal-display">0</div>
                <div class="text-[10px] text-slate-500 uppercase">Kcal Burned</div>
            </div>
        </div>

        <div id="workout-container" class="space-y-3 pb-24">
            </div>

        <div class="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <button id="generate-btn" class="pointer-events-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-2xl shadow-indigo-500/30 transition transform hover:scale-105 active:scale-95 flex items-center">
                <i class="fas fa-sync-alt mr-2"></i> New Workout
            </button>
        </div>
    </div>

    <div id="settings-modal" class="hidden fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
        <div class="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 slide-up">
            <h2 class="text-xl font-bold text-white mb-4"><i class="fas fa-sliders-h mr-2"></i> Settings</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-slate-400 uppercase">Difficulty</label>
                    <select id="setting-difficulty" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white mt-1">
                        <option value="1">Standard</option>
                        <option value="1.5">Beast Mode (1.5x)</option>
                        <option value="0.7">Light (0.7x)</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs text-slate-400 uppercase">Focus</label>
                    <select id="setting-focus" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white mt-1">
                        <option value="all">Full Body Mix</option>
                        <option value="Cardio">Cardio Only</option>
                        <option value="Strength">Strength Only</option>
                        <option value="Core">Core Only</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs text-slate-400 uppercase">Rest Timer</label>
                    <select id="setting-rest" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white mt-1">
                        <option value="10">10 Seconds</option>
                        <option value="30" selected>30 Seconds</option>
                        <option value="60">60 Seconds</option>
                        <option value="0">Off</option>
                    </select>
                </div>
                <div class="flex items-center justify-between">
                    <label class="text-sm text-white">Enable Audio Coach</label>
                    <input type="checkbox" id="setting-audio" checked class="w-5 h-5 accent-indigo-500">
                </div>
            </div>

            <div class="mt-6 flex space-x-3">
                <button id="close-settings" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Cancel</button>
                <button id="save-settings" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg">Save & New</button>
            </div>
             <div class="mt-4 text-center">
                <button id="reset-data" class="text-xs text-red-400 hover:text-red-300">Reset All Data</button>
            </div>
        </div>
    </div>

    <div id="rest-modal" class="hidden fixed inset-0 z-50 bg-indigo-900/95 flex flex-col items-center justify-center text-center p-6">
        <h2 class="text-indigo-200 text-xl uppercase tracking-widest mb-2">Rest & Recover</h2>
        <div class="text-8xl font-bold text-white font-mono mb-8" id="rest-countdown">30</div>
        
        <div class="text-indigo-300 text-sm mb-8" id="up-next-text">Up Next: Burpees</div>

        <button id="skip-rest" class="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full">
            Skip Rest <i class="fas fa-forward ml-2"></i>
        </button>
    </div>

    <div id="info-modal" class="hidden fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
        <div class="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 slide-up relative">
            <button id="close-info" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fas fa-times text-xl"></i></button>
            
            <div class="text-center mb-4">
                <div class="w-16 h-16 bg-slate-700 rounded-full mx-auto flex items-center justify-center text-3xl text-indigo-400 mb-3">
                    <i id="info-icon" class="fas fa-dumbbell"></i>
                </div>
                <h2 id="info-title" class="text-2xl font-bold text-white">Exercise Name</h2>
                <span id="info-type" class="text-xs uppercase bg-slate-700 px-2 py-1 rounded text-slate-300">Type</span>
            </div>
            
            <div class="bg-slate-900 p-4 rounded-lg text-sm text-slate-300 leading-relaxed" id="info-desc">
                Description goes here...
            </div>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            
            // --- STATE MANAGEMENT ---
            const DEFAULT_STATE = {
                settings: { difficulty: 1, focus: 'all', restTime: 30, audio: true },
                streak: { count: 0, lastDate: null },
                currentWorkout: null, // Stores the active list
                calories: 0
            };

            let appState = JSON.parse(localStorage.getItem('workoutApp_v1')) || DEFAULT_STATE;
            let activeTimers = {};
            let restInterval = null;

            // --- DATA SOURCE ---
            const exerciseDB = [
                { id: 1, name: "Push Ups", base: 15, unit: "Reps", type: "Strength", cal: 0.5, icon: "fa-hand-rock", desc: "Keep body straight, lower chest to floor, push back up." },
                { id: 2, name: "Jump Squats", base: 15, unit: "Reps", type: "Cardio", cal: 0.8, icon: "fa-frog", desc: "Squat down and explode upwards into a jump. Land softly." },
                { id: 3, name: "Plank", base: 30, unit: "Sec", isTime: true, type: "Core", cal: 0.1, icon: "fa-stopwatch", desc: "Hold push-up position on elbows. Keep core tight." },
                { id: 4, name: "Burpees", base: 10, unit: "Reps", type: "Full Body", cal: 1.2, icon: "fa-fire", desc: "Drop to chest, push up, jump feet to hands, jump up." },
                { id: 5, name: "Mtn Climbers", base: 30, unit: "Sec", isTime: true, type: "Cardio", cal: 0.3, icon: "fa-mountain", desc: "Plank position, alternate driving knees to chest rapidly." },
                { id: 6, name: "Lunges", base: 12, unit: "Reps", type: "Legs", cal: 0.4, icon: "fa-walking", desc: "Step forward, lower hip until both knees are 90 degrees." },
                { id: 7, name: "Russian Twists", base: 20, unit: "Reps", type: "Core", cal: 0.3, icon: "fa-sync-alt", desc: "Sit with feet off ground, twist torso touching floor on sides." },
                { id: 8, name: "Jumping Jacks", base: 40, unit: "Reps", type: "Cardio", cal: 0.2, icon: "fa-person-jumping", desc: "Jump feet apart raising hands, jump back together." },
                { id: 9, name: "Wall Sit", base: 30, unit: "Sec", isTime: true, type: "Legs", cal: 0.15, icon: "fa-chair", desc: "Sit against wall, knees at 90 degrees. Hold it." },
                { id: 10, name: "Tricep Dips", base: 15, unit: "Reps", type: "Arms", cal: 0.4, icon: "fa-angle-double-down", desc: "Use a chair/ledge. Lower body by bending elbows, push up." }
            ];

            // --- INIT ---
            initApp();

            function initApp() {
                updateHeader();
                
                // If we have a stored workout that isn't fully done, load it.
                // Otherwise generate new if date changed or empty.
                if (appState.currentWorkout && appState.currentWorkout.length > 0) {
                    renderWorkout(appState.currentWorkout);
                } else {
                    generateWorkout();
                }

                // Load settings into modal inputs
                $('#setting-difficulty').val(appState.settings.difficulty);
                $('#setting-focus').val(appState.settings.focus);
                $('#setting-rest').val(appState.settings.restTime);
                $('#setting-audio').prop('checked', appState.settings.audio);
            }

            function saveState() {
                localStorage.setItem('workoutApp_v1', JSON.stringify(appState));
                updateHeader();
            }

            function updateHeader() {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                $('#date-display').text(today);
                $('#streak-display').text(appState.streak.count);
                $('#cal-display').text(Math.floor(appState.calories));
            }

            // --- AUDIO ENGINE ---
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            function playBeep(freq = 600, type = 'sine', duration = 0.1) {
                if (!appState.settings.audio) return;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
                osc.stop(audioCtx.currentTime + duration);
            }

            function speak(text) {
                if (!appState.settings.audio || !('speechSynthesis' in window)) return;
                window.speechSynthesis.cancel(); // kill previous
                const msg = new SpeechSynthesisUtterance(text);
                msg.rate = 1.1;
                msg.pitch = 1.0;
                window.speechSynthesis.speak(msg);
            }

            // --- GENERATOR LOGIC ---
            function generateWorkout() {
                // Filter by Focus
                let pool = exerciseDB;
                const focus = appState.settings.focus;
                if (focus !== 'all') {
                    pool = exerciseDB.filter(e => e.type === focus);
                    // Fallback if pool too small
                    if (pool.length < 3) pool = exerciseDB; 
                }

                // Shuffle
                let shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
                const diffMult = parseFloat(appState.settings.difficulty);

                // Build Workout Objects with scaled values
                appState.currentWorkout = shuffled.map(ex => {
                    const val = Math.ceil(ex.base * diffMult);
                    return {
                        ...ex,
                        targetVal: val,
                        completed: false,
                        uniqueId: Date.now() + Math.random().toString(16).slice(2)
                    };
                });
                
                appState.calories = 0; // Reset daily calories on new generate
                saveState();
                renderWorkout(appState.currentWorkout);
                speak("New workout generated. Let's do this.");
            }

            function renderWorkout(list) {
                const container = $('#workout-container');
                container.empty();

                list.forEach((ex, idx) => {
                    // Calculate Total Calories for this item
                    const totalCals = (ex.cal * ex.targetVal).toFixed(1);
                    const isCompleted = ex.completed ? 'completed' : '';
                    
                    // Controls: Timer or Checkbox
                    let controls = '';
                    if (ex.isTime) {
                        controls = `
                             <div class="flex items-center space-x-2 mt-2">
                                <button class="timer-btn w-8 h-8 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center" 
                                    data-id="${ex.uniqueId}" data-time="${ex.targetVal}">
                                    <i class="fas fa-play text-xs"></i>
                                </button>
                                <span id="time-${ex.uniqueId}" class="font-mono text-xl font-bold text-emerald-400 w-12 text-center ml-2">${ex.targetVal}s</span>
                            </div>
                        `;
                    } else {
                        controls = `<p class="text-sm text-slate-400 font-bold mt-1">${ex.targetVal} ${ex.unit}</p>`;
                    }

                    const html = `
                        <div class="exercise-card relative bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex items-center justify-between fade-in ${isCompleted}" data-uid="${ex.uniqueId}" style="animation-delay: ${idx * 100}ms">
                            <div class="flex items-center flex-grow">
                                <div class="cursor-pointer info-trigger w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-indigo-500 hover:text-white hover:bg-indigo-600 transition" data-idx="${idx}">
                                    <i class="fas ${ex.icon} text-lg"></i>
                                    <div class="absolute -top-1 -left-1 w-4 h-4 bg-slate-600 rounded-full text-[8px] flex items-center justify-center text-white border border-slate-800">?</div>
                                </div>
                                <div class="ml-4">
                                    <h3 class="font-bold text-white text-lg">${ex.name}</h3>
                                    ${controls}
                                </div>
                            </div>
                            <div class="ml-4 flex flex-col items-end space-y-2">
                                <span class="text-[10px] text-slate-500 font-mono">~${totalCals} kcal</span>
                                <button class="check-btn w-10 h-10 rounded-full border-2 border-slate-600 hover:border-emerald-500 flex items-center justify-center transition text-slate-600"
                                    data-uid="${ex.uniqueId}" data-cals="${totalCals}">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    container.append(html);
                });
            }

            // --- ACTION HANDLERS ---

            // 1. Info Modal
            $(document).on('click', '.info-trigger', function() {
                const idx = $(this).data('idx');
                const ex = appState.currentWorkout[idx];
                $('#info-icon').attr('class', `fas ${ex.icon}`);
                $('#info-title').text(ex.name);
                $('#info-type').text(ex.type);
                $('#info-desc').text(ex.desc);
                $('#info-modal').removeClass('hidden');
            });

            $('#close-info').click(() => $('#info-modal').addClass('hidden'));

            // 2. Check Item & Rest Logic
            $(document).on('click', '.check-btn', function() {
                const uid = $(this).data('uid');
                const cals = parseFloat($(this).data('cals'));
                
                // Update State
                const exIndex = appState.currentWorkout.findIndex(e => e.uniqueId === uid);
                appState.currentWorkout[exIndex].completed = true;
                appState.calories += cals;
                
                // UI Update
                $(this).closest('.exercise-card').addClass('completed');
                saveState();

                // Check for completion or Trigger Rest
                const allDone = appState.currentWorkout.every(e => e.completed);
                
                if (allDone) {
                    handleDailyComplete();
                } else {
                    // Trigger Rest if enabled and not last item
                    if (appState.settings.restTime > 0) {
                        const nextEx = appState.currentWorkout.find(e => !e.completed);
                        triggerRest(nextEx ? nextEx.name : "Final Push");
                    }
                }
            });

            // 3. Timer Logic (In-Card)
            $(document).on('click', '.timer-btn', function() {
                const btn = $(this);
                const uid = btn.data('id');
                const display = $(`#time-${uid}`);
                
                if (btn.hasClass('running')) {
                    // Pause
                    clearInterval(activeTimers[uid]);
                    btn.removeClass('running bg-yellow-500').addClass('bg-emerald-600');
                    btn.find('i').attr('class', 'fas fa-play text-xs');
                    return;
                }

                // Start
                btn.addClass('running bg-yellow-500').removeClass('bg-emerald-600');
                btn.find('i').attr('class', 'fas fa-pause text-xs');
                
                let timeLeft = parseInt(display.text());
                
                activeTimers[uid] = setInterval(() => {
                    timeLeft--;
                    display.text(timeLeft + "s");
                    
                    if (timeLeft <= 3 && timeLeft > 0) playBeep(400); // Countdown beep
                    
                    if (timeLeft <= 0) {
                        clearInterval(activeTimers[uid]);
                        playBeep(800, 'square', 0.5); // End beep
                        btn.closest('.exercise-card').find('.check-btn').click(); // Auto-complete
                    }
                }, 1000);
            });

            // 4. Rest Overlay Logic
            function triggerRest(nextName) {
                const modal = $('#rest-modal');
                const display = $('#rest-countdown');
                let restTime = parseInt(appState.settings.restTime);
                
                $('#up-next-text').text(`Up Next: ${nextName}`);
                modal.removeClass('hidden');
                speak(`Rest for ${restTime} seconds.`);

                restInterval = setInterval(() => {
                    restTime--;
                    display.text(restTime);
                    
                    if (restTime <= 3 && restTime > 0) playBeep(300);
                    
                    if (restTime <= 0) {
                        endRest();
                        playBeep(600, 'sine', 0.5);
                        speak("Let's go.");
                    }
                }, 1000);
            }

            function endRest() {
                clearInterval(restInterval);
                $('#rest-modal').addClass('hidden');
            }

            $('#skip-rest').click(endRest);

            // 5. Gamification Logic
            function handleDailyComplete() {
                playBeep(600, 'triangle', 0.1);
                setTimeout(() => playBeep(800, 'triangle', 0.2), 150);
                speak("Workout complete! Excellent work.");
                
                const todayStr = new Date().toDateString();
                
                // Streak Logic
                if (appState.streak.lastDate !== todayStr) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    if (appState.streak.lastDate === yesterday.toDateString()) {
                        appState.streak.count++;
                    } else {
                        appState.streak.count = 1; // Reset if broken or first time
                    }
                    appState.streak.lastDate = todayStr;
                    saveState();
                    
                    // Celebration Animation
                    const badge = $('#streak-display').parent();
                    badge.addClass('scale-150');
                    setTimeout(() => badge.removeClass('scale-150'), 500);
                }
                
                alert(`Workout Complete! Total Calories: ${Math.floor(appState.calories)}`);
            }

            // --- SETTINGS HANDLERS ---
            $('#open-settings').click(() => $('#settings-modal').removeClass('hidden'));
            $('#close-settings').click(() => $('#settings-modal').addClass('hidden'));
            
            $('#save-settings').click(() => {
                appState.settings.difficulty = $('#setting-difficulty').val();
                appState.settings.focus = $('#setting-focus').val();
                appState.settings.restTime = $('#setting-rest').val();
                appState.settings.audio = $('#setting-audio').is(':checked');
                
                $('#settings-modal').addClass('hidden');
                generateWorkout(); // Regenerate with new settings
            });

            $('#reset-data').click(() => {
                if(confirm("Reset streak and settings?")) {
                    localStorage.removeItem('workoutApp_v1');
                    location.reload();
                }
            });

            $('#generate-btn').click(generateWorkout);
        });
    </script>
</body>
</html>
