// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, VertexAIBackend } from "firebase/ai";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chirpchat-yi7xn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chirpchat-yi7xn.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "786711867654",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:786711867654:web:a845ace12b0f9c526c2e87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the default database (no need to specify '(default)' as it's the default)
export const db = getFirestore(app);

// Initialize Firebase AI Logic with Vertex AI Backend (always enabled)
let ai: any = null;
try {
  ai = getAI(app, { backend: new VertexAIBackend() });
  console.log('Firebase AI initialized successfully');
} catch (error) {
  console.warn('Firebase AI initialization failed:', error);
  ai = null;
}
export { ai };
