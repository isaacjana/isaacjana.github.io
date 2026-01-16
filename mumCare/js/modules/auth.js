import { auth, googleProvider, db } from '../firebase-config.js';

export const initAuth = (onLogin, onLogout) => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const doc = await db.collection('users').doc(user.uid).get();
            if (!doc.exists || !doc.data().dueDate) {
                document.getElementById('onboarding-modal').style.display = 'flex';
            } else {
                onLogin(user, doc.data());
            }
        } else {
            onLogout();
        }
    });

    document.getElementById('google-btn')?.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider).catch(error => alert(error.message));
    });
};

export const finishOnboarding = async (dueDate) => {
    const user = auth.currentUser;
    await db.collection('users').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        dueDate: dueDate,
        budget: 'minimal'
    }, { merge: true });
    location.reload();
};

export const logout = () => auth.signOut();
