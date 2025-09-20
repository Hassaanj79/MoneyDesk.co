import { db } from '@/lib/firebase';
import type { Budget } from '@/types';
import { collection, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';

const getBudgetsCollection = (userId: string) => collection(db, 'users', userId, 'budgets');

export const getBudgets = (userId: string) => {
    const budgetsCol = getBudgetsCollection(userId);
    return query(budgetsCol);
}

export const addBudget = async (userId: string, budget: Omit<Budget, 'id' | 'userId'>) => {
    const budgetsCol = getBudgetsCollection(userId);
    return await addDoc(budgetsCol, budget);
};

export const updateBudget = async (userId: string, budgetId: string, updates: Partial<Omit<Budget, 'id' | 'userId'>>) => {
    const budgetsCol = getBudgetsCollection(userId);
    const budgetRef = doc(budgetsCol, budgetId);
    
    // Filter out undefined values to prevent Firebase errors
    const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(budgetRef, filteredUpdates);
};

export const deleteBudget = async (userId: string, budgetId: string) => {
    const budgetsCol = getBudgetsCollection(userId);
    const budgetRef = doc(budgetsCol, budgetId);
    await deleteDoc(budgetRef);
};
