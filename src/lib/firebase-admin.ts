import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp = null;
let adminDb = null;
let adminAuth = null;

// Function to safely initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
      // Try to initialize with service account key if available
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      console.log('Firebase Admin SDK initialization attempt:');
      console.log('- Service account key exists:', !!serviceAccountKey);
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      
      if (serviceAccountKey && serviceAccountKey.trim() !== '') {
        try {
          // Parse the service account key
          const serviceAccount = JSON.parse(serviceAccountKey);
          
          // Validate required fields
          if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
            throw new Error('Invalid service account key: missing required fields');
          }
          
          // Fix the private key format for Vercel
          if (serviceAccount.private_key && !serviceAccount.private_key.includes('\\n')) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
          });
          console.log('Firebase Admin SDK initialized with service account key');
        } catch (parseError) {
          console.error('Failed to parse service account key:', parseError);
          throw parseError;
        }
      } else {
        // For production, try to use the service account key from environment
        // If not available, try Application Default Credentials
        console.log('No service account key found, trying Application Default Credentials');
        
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
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.log('Falling back to client SDK for development');
    adminApp = null;
    adminDb = null;
    adminAuth = null;
    return false;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export { adminDb, adminAuth };
export default adminApp;
