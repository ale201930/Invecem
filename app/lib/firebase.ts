
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDDwbu6jA8o_9UKZUPQWPNCVElMJ-EQFtg",
  authDomain: "invecem-d8972.firebaseapp.com",
  projectId: "invecem-d8972",
  storageBucket: "invecem-d8972.firebasestorage.app",
  messagingSenderId: "726612092652",
  appId: "1:726612092652:web:81f4356532156e07a4e7c9",
  measurementId: "G-0YYJYX3T4D"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);