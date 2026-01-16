// auth.js

function signIn() {
    $('#login-container').addClass('hidden');
    $('#loading').removeClass('hidden');

    auth.signInWithPopup(googleProvider)
        .then((result) => {
            const user = result.user;
            checkUserRole(user);
        })
        .catch((error) => {
            console.error("Error signing in", error);
            $('#loading').addClass('hidden');
            $('#login-container').removeClass('hidden');
            $('#error-msg').text(error.message).removeClass('hidden');
        });
}

function checkUserRole(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            // Redirect based on intent or just reload to let the main app handle it if we were SPA, 
            // but here we redirect to dashboard.
            window.location.href = 'dashboard.html';
        } else {
            // New user, create as client by default
            userRef.set({
                name: user.displayName,
                email: user.email,
                role: 'client', // Default role
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        }
    }).catch((error) => {
        console.error("Error checking user:", error);
    });
}

function signOut() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// Global Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in.
        // We can do global stuff here if needed
        console.log("User is signed in:", user.email);
    } else {
        // No user is signed in.
        if (!window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
});
