// Firebase v9+
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdAoFYS_j2r58mZZeadwEz9h91zKj78zU",
  authDomain: "life-rpg-e7808.firebaseapp.com",
  projectId: "life-rpg-e7808",
  storageBucket: "life-rpg-e7808.firebasestorage.app",
  messagingSenderId: "1003021084182",
  appId: "1:1003021084182:web:0b84ad6782f8dc3034b737",
  measurementId: "G-KNSRPK9PM1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = "default"; // later replaced by auth

window.cloudSave = async (data) => {
  await setDoc(doc(db, "users", USER_ID), data);
};

window.cloudLoad = async () => {
  const snap = await getDoc(doc(db, "users", USER_ID));
  return snap.exists() ? snap.data() : null;
};


