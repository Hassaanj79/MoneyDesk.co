import { db } from '@/lib/firebase';
import type { Account } from '@/types';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, getDoc } from 'firebase/firestore';

const getAccountsCollection = (userId: string) => collection(db, 'users', userId, 'accounts');

export const getAccounts = (userId: string) => {
    const accountsCol = getAccountsCollection(userId);
    return query(accountsCol);
}

export const getAccount = async (userId: string, accountId: string): Promise<Account | null> => {
    const accountsCol = getAccountsCollection(userId);
    const accountRef = doc(accountsCol, accountId);
    const accountDoc = await getDoc(accountRef);
    
    if (accountDoc.exists()) {
        return { id: accountDoc.id, ...accountDoc.data() } as Account;
    }
    
    return null;
};

export const addAccount = async (userId: string, account: Omit<Account, 'id' | 'userId'>) => {
    const accountsCol = getAccountsCollection(userId);
    return await addDoc(accountsCol, account);
};

export const updateAccount = async (userId: string, accountId: string, updates: Partial<Omit<Account, 'id' | 'userId'>>) => {
    const accountsCol = getAccountsCollection(userId);
    const accountRef = doc(accountsCol, accountId);
    await updateDoc(accountRef, updates);
};

export const deleteAccount = async (userId: string, accountId: string) => {
    const accountsCol = getAccountsCollection(userId);
    const accountRef = doc(accountsCol, accountId);
    await deleteDoc(accountRef);
};
