// Firebase connectivity test
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
  authDomain: "chirpchat-yi7xn.firebaseapp.com",
  projectId: "chirpchat-yi7xn",
  storageBucket: "chirpchat-yi7xn.appspot.com",
  messagingSenderId: "786711867654",
  appId: "1:786711867654:web:a845ace12b0f9c526c2e87"
};

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('Firebase initialized successfully');
    console.log('Auth domain:', auth.config.authDomain);
    console.log('Project ID:', auth.config.projectId);
    
    // Test if we can access Firebase services
    console.log('Auth instance:', auth);
    console.log('Firestore instance:', db);
    
    return {
      success: true,
      auth,
      db,
      config: firebaseConfig
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Test function to check if Firebase is reachable
export async function testFirebaseReachability() {
  try {
    // Test if we can reach Firebase Auth API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        returnSecureToken: true
      })
    });
    
    console.log('Firebase API reachability test response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Firebase reachability test failed:', error);
    return false;
  }
}
