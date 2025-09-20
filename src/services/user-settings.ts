import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserSettings {
  currency: string;
  country: string;
  timezone: string;
}

const getUserSettingsDocRef = (userId: string) => doc(db, 'userSettings', userId);

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const settingsDoc = await getDoc(getUserSettingsDocRef(userId));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as UserSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  try {
    await setDoc(getUserSettingsDocRef(userId), {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const initializeUserSettings = async (userId: string): Promise<UserSettings> => {
  const defaultSettings: UserSettings = {
    currency: 'USD',
    country: 'US',
    timezone: 'America/New_York'
  };

  try {
    await setDoc(getUserSettingsDocRef(userId), {
      ...defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return defaultSettings;
  } catch (error) {
    console.error('Error initializing user settings:', error);
    throw error;
  }
};
