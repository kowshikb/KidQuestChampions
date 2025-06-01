import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Use environment variables or globals
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? __firebase_config 
  : {
      apiKey: "AIzaSyDummyKeyForDevelopment",
      authDomain: "kidquest-champions.firebaseapp.com",
      projectId: "kidquest-champions",
      storageBucket: "kidquest-champions.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdefghijklmnopqrstuv"
    };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get app_id from environment or fallback
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'kidquest-champions-dev';

// Define the base path for all Firestore operations
export const getBasePath = () => `/artifacts/${APP_ID}/public/data`;

export { app, db, auth };