import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, where, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAOEMrxylKIxZQgsY-aHMI87KmVIqMh9AQ",
    authDomain: "wedding-rvsp-e446c.firebaseapp.com",
    projectId: "wedding-rvsp-e446c",
    storageBucket: "wedding-rvsp-e446c.firebasestorage.app",
    messagingSenderId: "836260285764",
    appId: "1:836260285764:web:b1e8ca3ea64f7616e7db11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, getDocs, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, where, getDoc };
