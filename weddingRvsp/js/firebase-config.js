import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

export { db, collection, addDoc, getDocs, onSnapshot, query, orderBy };
