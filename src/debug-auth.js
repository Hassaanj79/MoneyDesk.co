// Debug script to test Firebase authentication
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
  authDomain: "chirpchat-yi7xn.firebaseapp.com",
  projectId: "chirpchat-yi7xn",
  storageBucket: "chirpchat-yi7xn.appspot.com",
  messagingSenderId: "786711867654",
  appId: "1:786711867654:web:a845ace12b0f9c526c2e87"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test authentication
async function testAuth() {
  try {
    console.log('Testing Firebase connection...');
    console.log('Auth domain:', auth.config.authDomain);
    console.log('Project ID:', auth.config.projectId);
    
    // Try to sign in with test credentials
    const result = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('Login successful:', result.user.email);
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testAuth();
