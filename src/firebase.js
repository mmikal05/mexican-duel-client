import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3mTozrMey_8ZiSYyDJUnAjhPfldR-s-U",
  authDomain: "mexican-duel.firebaseapp.com",
  projectId: "mexican-duel",
  storageBucket: "mexican-duel.firebasestorage.app",
  messagingSenderId: "333329594750",
  appId: "1:333329594750:web:2760fd534862d6e5f5db2f",
  measurementId: "G-NMEKXFNKV0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);