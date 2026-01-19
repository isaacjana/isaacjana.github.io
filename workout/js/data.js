const exercisesDB = {
    low: {
        warmup: [
            { name: "Shoulder Circles", tip: "Rotate backwards slowly", duration: 30, category: "Upper" },
            { name: "March in Place", tip: "Lift knees as high as comfortable", duration: 60, category: "Cardio" },
            { name: "Side Reach", tip: "Stretch through your fingertips", duration: 60, category: "Core" },
            { name: "Leg Swings", tip: "Hold a wall for balance", duration: 60, category: "Lower" },
            { name: "Arm Swings", tip: "Inhale as you open, exhale as you close", duration: 30, category: "Upper" }
        ],
        main: [
            { name: "Wall Pushups", tip: "Keep your body in a straight line", duration: 45, category: "Upper" },
            { name: "Sitting Knee Lifts", tip: "Engage your lower abs", duration: 45, category: "Core" },
            { name: "Glute Bridges", tip: "Squeeze at the top", duration: 45, category: "Lower" },
            { name: "Standing Bird Dog", tip: "Reach with opposite hand and leg", duration: 45, category: "Core" },
            { name: "Modified Squats", tip: "Use a chair for depth guidance", duration: 45, category: "Lower" },
            { name: "Side Steps", tip: "Stay low to activate glutes", duration: 45, category: "Lower" },
            { name: "Standing Wall Slide", tip: "Keep back flat against the wall", duration: 45, category: "Upper" },
            { name: "Calf Raises", tip: "Pause briefly at the top", duration: 45, category: "Lower" }
        ],
        cool: [
            { name: "Neck Stretch", tip: "Relax your shoulders", duration: 60, category: "Upper" },
            { name: "Standing Quad Stretch", tip: "Hold a wall for support", duration: 60, category: "Lower" },
            { name: "Chest Stretch", tip: "Open up those shoulders", duration: 60, category: "Upper" },
            { name: "Deep Breathing", tip: "Slowly exhale to lower heart rate", duration: 60, category: "Cardio" }
        ]
    },
    moderate: {
        warmup: [
            { name: "Jumping Jacks", tip: "Soft landing on the toes", duration: 60, category: "Cardio" },
            { name: "High Knees", tip: "Pace yourself", duration: 60, category: "Cardio" },
            { name: "Butt Kicks", tip: "Keep your chest up", duration: 60, category: "Lower" },
            { name: "Arm Circles", tip: "Build some heat in shoulders", duration: 60, category: "Upper" },
            { name: "Cat Cow", tip: "Articulate your spine", duration: 30, category: "Core" }
        ],
        main: [
            { name: "Standard Pushups", tip: "Elbows at 45 degree angle", duration: 45, category: "Upper" },
            { name: "Bodyweight Squats", tip: "Weight in your heels", duration: 45, category: "Lower" },
            { name: "Walking Lunges", tip: "Keep front knee over ankle", duration: 45, category: "Lower" },
            { name: "Plank Hold", tip: "Squeeze your glutes tightly", duration: 45, category: "Core" },
            { name: "Mountain Climbers", tip: "Drive knees toward chest", duration: 45, category: "Cardio" },
            { name: "Russian Twists", tip: "Touch the floor on each side", duration: 45, category: "Core" },
            { name: "Bicycle Crunches", tip: "Opposite elbow to knee", duration: 45, category: "Core" },
            { name: "Superman", tip: "Hold for a second at the top", duration: 45, category: "Core" }
        ],
        cool: [
            { name: "Child's Pose", tip: "Reach fingers forward", duration: 60, category: "Core" },
            { name: "Cobra Stretch", tip: "Look up toward the ceiling", duration: 60, category: "Core" },
            { name: "Hamstring Stretch", tip: "Reach for your toes", duration: 60, category: "Lower" },
            { name: "Butterfly Stretch", tip: "Palms together, drop knees", duration: 60, category: "Lower" }
        ]
    },
    high: {
        warmup: [
            { name: "Burpees", tip: "Warm up the whole body", duration: 60, category: "Cardio" },
            { name: "High Knee Run", tip: "Maximum effort", duration: 60, category: "Cardio" },
            { name: "Dynamic Lunges", tip: "Flow through the movement", duration: 60, category: "Lower" },
            { name: "Mountain Climbers", tip: "Fast pace", duration: 60, category: "Cardio" },
            { name: "Shoulder Taps", tip: "Keep hips stable", duration: 60, category: "Upper" }
        ],
        main: [
            { name: "Chest-to-Floor Pushups", tip: "Explosive movement up", duration: 45, category: "Upper" },
            { name: "Jump Squats", tip: "Land softly and roll through foot", duration: 45, category: "Lower" },
            { name: "Diamond Pushups", tip: "Focus on the triceps", duration: 45, category: "Upper" },
            { name: "Plank Jacks", tip: "Keep core absolutely still", duration: 45, category: "Core" },
            { name: "Speed Skaters", tip: "Wide lateral jumps", duration: 45, category: "Cardio" },
            { name: "Hollow Body Hold", tip: "Lower back pressed to floor", duration: 45, category: "Core" },
            { name: "V-Ups", tip: "Synchronized lift", duration: 45, category: "Core" },
            { name: "Burpees (Circuit)", tip: "Give it your all!", duration: 45, category: "Cardio" }
        ],
        cool: [
            { name: "Pigeon Stretch", tip: "Deep hip opener", duration: 60, category: "Lower" },
            { name: "Downward Dog", tip: "Pedal out the feet", duration: 60, category: "Lower" },
            { name: "Thread the Needle", tip: "Release the shoulders", duration: 60, category: "Upper" },
            { name: "Deep Meditation", tip: "Acknowledge your effort", duration: 60, category: "Cardio" }
        ]
    }
};
