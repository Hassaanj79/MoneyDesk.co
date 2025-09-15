import { db } from '@/lib/firebase';
import type { Account } from '@/types';
import { collection, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';

const getAccountsCollection = (userId: string) => collection(db, 'users', userId, 'accounts');

export const getAccounts = (userId: string) => {
    const accountsCol = getAccountsCollection(userId);
    return query(accountsCol);
}

export const addAccount = async (userId: string, account: Omit<Account, 'id' | 'userId' | 'balance'>) => {
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
