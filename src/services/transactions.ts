import { db } from '@/lib/firebase';
import type { Transaction } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';

// Note: We are using a subcollection 'transactions' for each user.
const getTransactionsCollection = (userId: string) => collection(db, 'users', userId, 'transactions');

// Get all transactions for a user
export const getTransactions = (userId: string) => {
    const transactionsCol = getTransactionsCollection(userId);
    return query(transactionsCol);
}

// Add a new transaction
export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id' | 'userId'>) => {
    const transactionsCol = getTransactionsCollection(userId);
    
    // Filter out undefined values to prevent Firebase errors
    const filteredTransaction = Object.fromEntries(
        Object.entries(transaction).filter(([_, value]) => value !== undefined)
    );
    
    // Ensure date is properly converted to a Date object
    let dateValue = transaction.date;
    if (typeof dateValue === 'string') {
        dateValue = new Date(dateValue);
    } else if (!(dateValue instanceof Date)) {
        dateValue = new Date();
    }
    
    const transactionData = {
        ...filteredTransaction,
        date: dateValue,
        createdAt: Timestamp.now()
    };
    
    console.log('Adding transaction to Firestore:', transactionData);
    return await addDoc(transactionsCol, transactionData);
};

// Update a transaction
export const updateTransaction = async (userId: string, transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    const transactionsCol = getTransactionsCollection(userId);
    const transactionRef = doc(transactionsCol, transactionId);
    
    // Filter out undefined values to prevent Firebase errors
    const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const updateData = { ...filteredUpdates };
    if (updates.date) {
        updateData.date = new Date(updates.date);
    }
    await updateDoc(transactionRef, updateData);
};

// Delete a transaction
export const deleteTransaction = async (userId: string, transactionId: string) => {
    const transactionsCol = getTransactionsCollection(userId);
    const transactionRef = doc(transactionsCol, transactionId);
    await deleteDoc(transactionRef);
};
