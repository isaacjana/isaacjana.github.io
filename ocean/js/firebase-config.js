const firebaseConfig = {
    apiKey: "AIzaSyDsGbfRlXxqUwLHXbGcwRYOvuygTPgTeMA",
    authDomain: "penny-wise-e482e.firebaseapp.com",
    databaseURL: "https://penny-wise-e482e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "penny-wise-e482e",
    storageBucket: "penny-wise-e482e.firebasestorage.app",
    messagingSenderId: "504425521894",
    appId: "1:504425521894:web:052c58c903a32ab05e9127",
    measurementId: "G-BB92FXKGD6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
