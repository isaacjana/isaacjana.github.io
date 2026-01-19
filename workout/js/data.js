const exercisesDB = {
    low: {
        warmup: [
            { name: "Shoulder Circles", tip: "Rotate backwards slowly", duration: 30 },
            { name: "March in Place", tip: "Lift knees as high as comfortable", duration: 60 },
            { name: "Side Reach", tip: "Stretch through your fingertips", duration: 60 },
            { name: "Leg Swings", tip: "Hold a wall for balance", duration: 60 },
            { name: "Arm Swings", tip: "Inhale as you open, exhale as you close", duration: 30 }
        ],
        main: [
            { name: "Wall Pushups", tip: "Keep your body in a straight line", duration: 45 },
            { name: "Sitting Knee Lifts", tip: "Engage your lower abs", duration: 45 },
            { name: "Glute Bridges", tip: "Squeeze at the top", duration: 45 },
            { name: "Standing Bird Dog", tip: "Reach with opposite hand and leg", duration: 45 },
            { name: "Modified Squats", tip: "Use a chair for depth guidance", duration: 45 },
            { name: "Side Steps", tip: "Stay low to activate glutes", duration: 45 },
            { name: "Standing Wall Slide", tip: "Keep back flat against the wall", duration: 45 },
            { name: "Calf Raises", tip: "Pause briefly at the top", duration: 45 }
        ],
        cool: [
            { name: "Neck Stretch", tip: "Relax your shoulders", duration: 60 },
            { name: "Standing Quad Stretch", tip: "Hold a wall for support", duration: 60 },
            { name: "Chest Stretch", tip: "Open up those shoulders", duration: 60 },
            { name: "Deep Breathing", tip: "Slowly exhale to lower heart rate", duration: 60 }
        ]
    },
    moderate: {
        warmup: [
            { name: "Jumping Jacks", tip: "Soft landing on the toes", duration: 60 },
            { name: "High Knees", tip: "Pace yourself", duration: 60 },
            { name: "Butt Kicks", tip: "Keep your chest up", duration: 60 },
            { name: "Arm Circles", tip: "Build some heat in shoulders", duration: 60 },
            { name: "Cat Cow", tip: "Articulate your spine", duration: 30 }
        ],
        main: [
            { name: "Standard Pushups", tip: "Elbows at 45 degree angle", duration: 45 },
            { name: "Bodyweight Squats", tip: "Weight in your heels", duration: 45 },
            { name: "Walking Lunges", tip: "Keep front knee over ankle", duration: 45 },
            { name: "Plank Hold", tip: "Squeeze your glutes tightly", duration: 45 },
            { name: "Mountain Climbers", tip: "Drive knees toward chest", duration: 45 },
            { name: "Russian Twists", tip: "Touch the floor on each side", duration: 45 },
            { name: "Bicycle Crunches", tip: "Opposite elbow to knee", duration: 45 },
            { name: "Superman", tip: "Hold for a second at the top", duration: 45 }
        ],
        cool: [
            { name: "Child's Pose", tip: "Reach fingers forward", duration: 60 },
            { name: "Cobra Stretch", tip: "Look up toward the ceiling", duration: 60 },
            { name: "Hamstring Stretch", tip: "Reach for your toes", duration: 60 },
            { name: "Butterfly Stretch", tip: "Palms together, drop knees", duration: 60 }
        ]
    },
    high: {
        warmup: [
            { name: "Burpees", tip: "Warm up the whole body", duration: 60 },
            { name: "High Knee Run", tip: "Maximum effort", duration: 60 },
            { name: "Dynamic Lunges", tip: "Flow through the movement", duration: 60 },
            { name: "Mountain Climbers", tip: "Fast pace", duration: 60 },
            { name: "Shoulder Taps", tip: "Keep hips stable", duration: 60 }
        ],
        main: [
            { name: "Chest-to-Floor Pushups", tip: "Explosive movement up", duration: 45 },
            { name: "Jump Squats", tip: "Land softly and roll through foot", duration: 45 },
            { name: "Diamond Pushups", tip: "Focus on the triceps", duration: 45 },
            { name: "Plank Jacks", tip: "Keep core absolutely still", duration: 45 },
            { name: "Speed Skaters", tip: "Wide lateral jumps", duration: 45 },
            { name: "Hollow Body Hold", tip: "Lower back pressed to floor", duration: 45 },
            { name: "V-Ups", tip: "Synchronized lift", duration: 45 },
            { name: "Burpees (Circuit)", tip: "Give it your all!", duration: 45 }
        ],
        cool: [
            { name: "Pigeon Stretch", tip: "Deep hip opener", duration: 60 },
            { name: "Downward Dog", tip: "Pedal out the feet", duration: 60 },
            { name: "Thread the Needle", tip: "Release the shoulders", duration: 60 },
            { name: "Deep Meditation", tip: "Acknowledge your effort", duration: 60 }
        ]
    }
};
