
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const getUserDocRef = (userId: string) => doc(db, 'users', userId);

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    const userDocRef = getUserDocRef(userId);
    await setDoc(userDocRef, { 
        ...profileData,
        updatedAt: serverTimestamp() 
    }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = getUserDocRef(userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
}

