// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPn8ifAQiRuPpw02JvWdJCKv7KpQIAuXA",
    authDomain: "mum-care.firebaseapp.com",
    projectId: "mum-care",
    storageBucket: "mum-care.firebasestorage.app",
    messagingSenderId: "1011450259230",
    appId: "1:1011450259230:web:6428b90fb4966e748a0b0f"
};

const firebase = window.firebase;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export { auth, db, googleProvider, firebase };
