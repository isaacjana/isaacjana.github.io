import { auth, provider, signInWithPopup, onAuthStateChanged, signOut } from './firebaseService.js';
import { showToast } from '../components/ui.js';

const CONFIG = {
    adminEmail: "isaacjana.h@gmail.com"
};

export const AppState = {
    isAuthenticated: false
};

export function setupAuthListener(onAuthenticated, onUnauthenticated) {
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === CONFIG.adminEmail) {
            AppState.isAuthenticated = true;
            onAuthenticated(user);
        } else {
            AppState.isAuthenticated = false;
            
            if (user) {
                showToast("Unauthorized access.", "⚠️");
                signOut(auth);
            }
            
            onUnauthenticated();
        }
    });
}

export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error("Sign in error:", err);
        showToast("Sign in failed. Please try again.", "⚠️");
    }
}

export function logout() {
    signOut(auth);
}
