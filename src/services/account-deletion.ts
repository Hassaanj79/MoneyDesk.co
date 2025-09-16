import { 
  deleteUser as deleteFirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from 'firebase/auth';

// Collections that store user data
const USER_DATA_COLLECTIONS = [
  'transactions',
  'accounts', 
  'budgets',
  'categories',
  'loans',
  'userProfiles',
  'notifications'
];

export interface DeleteAccountData {
  password: string;
}

export const deleteUserAccount = async (password: string): Promise<void> => {
  const user = auth.currentUser;
  
  if (!user || !user.email) {
    throw new Error('No authenticated user found');
  }

  try {
    // Re-authenticate user before deletion
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete all user data from Firestore
    await deleteAllUserData(user.uid);

    // Delete the Firebase Auth account
    await deleteFirebaseUser(user);
    
    console.log('Account and all data successfully deleted');
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

const deleteAllUserData = async (userId: string): Promise<void> => {
  const batch = writeBatch(db);
  let totalDeletions = 0;

  try {
    // Delete data from all user collections
    for (const collectionName of USER_DATA_COLLECTIONS) {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        totalDeletions++;
      });
    }

    // Also delete user profile by document ID (if it exists)
    const userProfileRef = doc(db, 'userProfiles', userId);
    batch.delete(userProfileRef);
    totalDeletions++;

    // Commit all deletions
    if (totalDeletions > 0) {
      await batch.commit();
      console.log(`Deleted ${totalDeletions} documents for user ${userId}`);
    } else {
      console.log('No user data found to delete');
    }
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data from database');
  }
};

export const getAccountDeletionWarning = (): string => {
  return `⚠️ WARNING: This action cannot be undone!

This will permanently delete:

• 🔐 Your account and authentication
• 💰 All transactions and financial data  
• 🏦 All accounts and budgets
• 🏷️ All categories and settings
• 💳 All loan records
• 🔔 All notifications and preferences

Your data will be completely removed from our servers and cannot be recovered.`;
};
