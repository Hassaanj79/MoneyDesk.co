import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
  // For development, we'll use the default service account
  // In production, you should use a service account key file
};

// Initialize Firebase Admin if not already initialized
let adminApp;
try {
  adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  // Fallback to client SDK for development
  adminApp = null;
}

// Get Firestore instance
export const adminDb = adminApp ? getFirestore(adminApp) : null;

export default adminApp;
