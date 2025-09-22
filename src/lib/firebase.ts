// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
  authDomain: "chirpchat-yi7xn.firebaseapp.com",
  projectId: "chirpchat-yi7xn",
  storageBucket: "chirpchat-yi7xn.appspot.com",
  messagingSenderId: "786711867654",
  appId: "1:786711867654:web:a845ace12b0f9c526c2e87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the default database (no need to specify '(default)' as it's the default)
export const db = getFirestore(app);
