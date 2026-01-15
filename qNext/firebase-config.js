/**
 * Firebase Configuration and Initialization
 * Using Firebase v9 Modular SDK (ES Modules)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, runTransaction, push, child, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CREDENTIALS
// Find these in: Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyDsGbfRlXxqUwLHXbGcwRYOvuygTPgTeMA",
    authDomain: "penny-wise-e482e.firebaseapp.com",
    projectId: "penny-wise-e482e",
    storageBucket: "penny-wise-e482e.firebasestorage.app",
    messagingSenderId: "504425521894",
    appId: "1:504425521894:web:cc703ad4b1d2c5435e9127",
    measurementId: "G-F5KKND2FT2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export the database and necessary methods
export { db, ref, set, update, onValue, runTransaction, push, child, get };
