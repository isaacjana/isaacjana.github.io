/**
 * DailyBurn - Exercise Database
 * Comprehensive workout data organized by intensity level
 */

const exercisesDB = {
    low: {
        warmup: [
            { name: "Shoulder Circles", tip: "Rotate slowly in large circles, breathing deeply.", duration: 30, category: "Upper" },
            { name: "March in Place", tip: "Lift your knees as high as comfortable, swing your arms.", duration: 60, category: "Cardio" },
            { name: "Side Reach", tip: "Stretch through your fingertips, feel the length.", duration: 60, category: "Core" },
            { name: "Gentle Leg Swings", tip: "Hold a wall for balance, keep movements controlled.", duration: 60, category: "Lower" },
            { name: "Arm Swings", tip: "Inhale as you open wide, exhale as arms cross.", duration: 30, category: "Upper" }
        ],
        main: [
            { name: "Wall Pushups", tip: "Keep your body in a straight line, elbows at 45°.", duration: 45, category: "Upper" },
            { name: "Seated Knee Lifts", tip: "Engage your lower abs, sit tall.", duration: 45, category: "Core" },
            { name: "Glute Bridges", tip: "Squeeze at the top, don't let hips drop.", duration: 45, category: "Lower" },
            { name: "Standing Bird Dog", tip: "Extend opposite hand and leg, balance is key.", duration: 45, category: "Core" },
            { name: "Chair Squats", tip: "Use a chair for depth guidance, weight in heels.", duration: 45, category: "Lower" },
            { name: "Side Steps", tip: "Stay low to activate glutes, keep core tight.", duration: 45, category: "Lower" },
            { name: "Wall Slides", tip: "Keep your entire back flat against the wall.", duration: 45, category: "Upper" },
            { name: "Calf Raises", tip: "Rise slowly, pause at the top, lower with control.", duration: 45, category: "Lower" }
        ],
        cool: [
            { name: "Neck Stretch", tip: "Relax your shoulders, gently tilt your head.", duration: 60, category: "Upper" },
            { name: "Quad Stretch", tip: "Hold a wall for support, keep knees together.", duration: 60, category: "Lower" },
            { name: "Chest Stretch", tip: "Open up your shoulders, feel the stretch.", duration: 60, category: "Upper" },
            { name: "Deep Breathing", tip: "Slowly inhale for 4, hold for 4, exhale for 6.", duration: 60, category: "Cardio" }
        ]
    },
    moderate: {
        warmup: [
            { name: "Jumping Jacks", tip: "Land softly on your toes, keep core engaged.", duration: 60, category: "Cardio" },
            { name: "High Knees", tip: "Drive your knees up, pump your arms.", duration: 60, category: "Cardio" },
            { name: "Butt Kicks", tip: "Keep your chest up, heels touch your glutes.", duration: 60, category: "Lower" },
            { name: "Arm Circles", tip: "Start small, gradually increase size.", duration: 60, category: "Upper" },
            { name: "Cat-Cow Stretch", tip: "Articulate your spine, sync with breath.", duration: 30, category: "Core" }
        ],
        main: [
            { name: "Standard Pushups", tip: "Keep elbows at 45°, full range of motion.", duration: 45, category: "Upper" },
            { name: "Bodyweight Squats", tip: "Weight in heels, chest up, depth matters.", duration: 45, category: "Lower" },
            { name: "Forward Lunges", tip: "Keep front knee over ankle, not past toes.", duration: 45, category: "Lower" },
            { name: "Plank Hold", tip: "Squeeze everything! Glutes, core, quads.", duration: 45, category: "Core" },
            { name: "Mountain Climbers", tip: "Drive knees toward chest, maintain plank.", duration: 45, category: "Cardio" },
            { name: "Russian Twists", tip: "Touch the floor on each side, lean back slightly.", duration: 45, category: "Core" },
            { name: "Bicycle Crunches", tip: "Opposite elbow to knee, full extension.", duration: 45, category: "Core" },
            { name: "Superman Hold", tip: "Lift arms and legs, squeeze at the top.", duration: 45, category: "Core" }
        ],
        cool: [
            { name: "Child's Pose", tip: "Reach fingers forward, sink hips back.", duration: 60, category: "Core" },
            { name: "Cobra Stretch", tip: "Press hips down, look up toward ceiling.", duration: 60, category: "Core" },
            { name: "Hamstring Stretch", tip: "Reach for your toes, keep back straight.", duration: 60, category: "Lower" },
            { name: "Butterfly Stretch", tip: "Press knees down gently, sit tall.", duration: 60, category: "Lower" }
        ]
    },
    high: {
        warmup: [
            { name: "Burpees", tip: "Full range! Jump high, chest to floor.", duration: 60, category: "Cardio" },
            { name: "High Knee Run", tip: "Maximum effort, pump those arms hard!", duration: 60, category: "Cardio" },
            { name: "Dynamic Lunges", tip: "Flow through movement, alternate legs.", duration: 60, category: "Lower" },
            { name: "Fast Mountain Climbers", tip: "Sprint pace! Keep that core tight.", duration: 60, category: "Cardio" },
            { name: "Shoulder Taps", tip: "Keep hips absolutely stable, no rotation.", duration: 60, category: "Upper" }
        ],
        main: [
            { name: "Explosive Pushups", tip: "Push hard! Hands should leave the ground.", duration: 45, category: "Upper" },
            { name: "Jump Squats", tip: "Land soft, roll through foot, explode up.", duration: 45, category: "Lower" },
            { name: "Diamond Pushups", tip: "Focus on triceps, hands form a diamond.", duration: 45, category: "Upper" },
            { name: "Plank Jacks", tip: "Keep core absolutely still, only legs move.", duration: 45, category: "Core" },
            { name: "Speed Skaters", tip: "Wide lateral jumps, touch the ground.", duration: 45, category: "Cardio" },
            { name: "Hollow Body Hold", tip: "Lower back pressed to floor, no arching.", duration: 45, category: "Core" },
            { name: "V-Ups", tip: "Synchronized lift, touch toes at top.", duration: 45, category: "Core" },
            { name: "Finisher Burpees", tip: "Everything you've got! Leave it all here.", duration: 45, category: "Cardio" }
        ],
        cool: [
            { name: "Pigeon Stretch", tip: "Deep hip opener, breathe into it.", duration: 60, category: "Lower" },
            { name: "Downward Dog", tip: "Pedal out the feet, press heels down.", duration: 60, category: "Lower" },
            { name: "Thread the Needle", tip: "Release shoulder tension, twist gently.", duration: 60, category: "Upper" },
            { name: "Final Relaxation", tip: "Lie flat, acknowledge your effort. You did it!", duration: 60, category: "Cardio" }
        ]
    }
};

// Exercise category descriptions for UI
const categoryInfo = {
    Upper: {
        icon: '💪',
        color: 'blue',
        description: 'Arms, shoulders, chest, and back'
    },
    Lower: {
        icon: '🦵',
        color: 'purple',
        description: 'Legs, glutes, and calves'
    },
    Core: {
        icon: '🎯',
        color: 'emerald',
        description: 'Abs, obliques, and lower back'
    },
    Cardio: {
        icon: '❤️',
        color: 'orange',
        description: 'Heart rate and endurance'
    }
};

// Motivational quotes for the workout
const motivationalQuotes = [
    "You're stronger than you think! 💪",
    "Every rep counts. Keep pushing!",
    "Your only competition is who you were yesterday.",
    "Sweat is just fat crying. 💧",
    "The pain you feel today is the strength you'll feel tomorrow.",
    "Don't stop when you're tired. Stop when you're done!",
    "Your body can do it. It's your mind you need to convince.",
    "Progress, not perfection.",
    "Believe in yourself and all that you are.",
    "The hardest lift is lifting yourself off the couch!"
];

// Get a random motivational quote
function getRandomQuote() {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}
