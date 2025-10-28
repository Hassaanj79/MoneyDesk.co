import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import type { MoneyPool } from '@/types';

/**
 * Create a new money pool
 */
export async function createPool(poolData: Omit<MoneyPool, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const poolsRef = collection(db, 'pools');
  
  const newPool = {
    ...poolData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(poolsRef, newPool);
  return docRef.id;
}

/**
 * Get all pools for a user
 */
export async function getUserPools(userId: string): Promise<MoneyPool[]> {
  const poolsRef = collection(db, 'pools');
  const q = query(poolsRef, where('createdBy', '==', userId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as MoneyPool[];
}

/**
 * Get a pool by ID
 */
export async function getPoolById(poolId: string): Promise<MoneyPool | null> {
  const poolRef = doc(db, 'pools', poolId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    return null;
  }
  
  return {
    id: poolSnap.id,
    ...poolSnap.data(),
  } as MoneyPool;
}

/**
 * Update a pool
 */
export async function updatePool(poolId: string, updates: Partial<MoneyPool>): Promise<void> {
  const poolRef = doc(db, 'pools', poolId);
  
  await updateDoc(poolRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a pool
 */
export async function deletePool(poolId: string): Promise<void> {
  const poolRef = doc(db, 'pools', poolId);
  await deleteDoc(poolRef);
}

/**
 * Subscribe to user's pools (real-time updates)
 */
export function subscribeToUserPools(
  userId: string,
  callback: (pools: MoneyPool[]) => void
): () => void {
  const poolsRef = collection(db, 'pools');
  const q = query(poolsRef, where('createdBy', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const pools = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MoneyPool[];
    
    callback(pools);
  });
}

