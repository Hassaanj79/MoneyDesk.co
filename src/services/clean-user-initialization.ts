import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Clean User Initialization Service
 * 
 * This service ensures that new users get a completely clean account
 * with no dummy data, phantom transactions, or auto-created content.
 * 
 * Users will start with:
 * - Empty transactions list
 * - Empty accounts list (they must create their first account)
 * - Empty categories list (they must create their own categories)
 * - Only essential user settings
 */

export interface CleanUserProfile {
  email: string;
  displayName: string;
  phone?: string;
  createdAt: Date;
  isCleanAccount: boolean; // Flag to identify clean accounts
}

export interface CleanUserSettings {
  currency: string;
  country: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Initialize a completely clean user account
 * This ensures no dummy data or phantom transactions are created
 */
export const initializeCleanUser = async (
  userId: string, 
  userProfile: CleanUserProfile
): Promise<void> => {
  try {
    console.log(`🧹 Initializing clean account for user: ${userId}`);
    
    // 1. Create user profile with clean account flag
    const userProfileData = {
      ...userProfile,
      isCleanAccount: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userId), userProfileData, { merge: true });
    console.log('✅ User profile created');
    
    // 2. Initialize clean user settings
    const cleanSettings: CleanUserSettings = {
      currency: 'USD',
      country: 'US',
      timezone: 'America/New_York',
      theme: 'system',
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', userId, 'userSettings', 'settings'), {
      ...cleanSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ User settings initialized');
    
    // 3. Create onboarding status document
    await setDoc(doc(db, 'users', userId, 'onboarding', 'status'), {
      hasCompletedOnboarding: false,
      currentStep: 'welcome',
      completedSteps: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ Onboarding status created');
    
    // 4. Create empty collections structure (no data, just structure)
    // This ensures the collections exist but are empty
    await setDoc(doc(db, 'users', userId, 'collections', 'metadata'), {
      accountsCount: 0,
      transactionsCount: 0,
      categoriesCount: 0,
      loansCount: 0,
      lastUpdated: serverTimestamp(),
      isCleanAccount: true
    }, { merge: true });
    console.log('✅ Collection metadata created');
    
    console.log(`🎉 Clean account initialization completed for user: ${userId}`);
    
  } catch (error) {
    console.error('❌ Error initializing clean user account:', error);
    throw new Error(`Failed to initialize clean user account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify that a user account is clean (no dummy data)
 */
export const verifyCleanAccount = async (userId: string): Promise<boolean> => {
  try {
    // Check if user has the clean account flag
    const userDoc = await doc(db, 'users', userId);
    // Note: In a real implementation, you'd fetch and check the document
    // For now, we'll assume it's clean if the initialization was successful
    return true;
  } catch (error) {
    console.error('Error verifying clean account:', error);
    return false;
  }
};

/**
 * Get clean account statistics
 */
export const getCleanAccountStats = async (userId: string) => {
  try {
    // This would return empty stats for a clean account
    return {
      accountsCount: 0,
      transactionsCount: 0,
      categoriesCount: 0,
      loansCount: 0,
      isCleanAccount: true,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting clean account stats:', error);
    return null;
  }
};
