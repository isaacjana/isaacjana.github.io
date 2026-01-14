const firebaseConfig = { 
    apiKey: "AIzaSyD4QLq5wS3t_W1ckxuBDWydSDWSkVcaW7k", 
    authDomain: "agile-works-ba545.firebaseapp.com", 
    projectId: "agile-works-ba545", 
    storageBucket: "agile-works-ba545.firebasestorage.app", 
    messagingSenderId: "588869159638", 
    appId: "1:588869159638:web:5bfc6e3740ec231776d777" 
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// Expose services globally
window.db = firebase.firestore(); 
window.auth = firebase.auth();

window.db.enablePersistence().catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistence not supported by browser');
    }
});
