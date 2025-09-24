import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp = null;
let adminDb = null;
let adminAuth = null;

try {
  // Check if Firebase Admin is already initialized
  if (getApps().length === 0) {
    // Try to initialize with service account key if available
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      // Parse the service account key
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
      });
      console.log('Firebase Admin SDK initialized with service account key');
    } else {
      // Try to initialize with Application Default Credentials (ADC)
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
      });
      console.log('Firebase Admin SDK initialized with Application Default Credentials');
    }
  } else {
    adminApp = getApps()[0];
    console.log('Firebase Admin SDK already initialized');
  }

  // Get Firestore and Auth instances
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
  
  console.log('Firebase Admin SDK successfully initialized');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  console.log('Falling back to client SDK for development');
  adminApp = null;
  adminDb = null;
  adminAuth = null;
}

export { adminDb, adminAuth };
export default adminApp;
