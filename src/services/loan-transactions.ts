import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { addTransaction } from './transactions';
import type { Transaction, Category } from '@/types';

/**
 * Service to handle automatic transaction creation for loans
 */

// Find or create loan categories
export const findOrCreateLoanCategories = async (userId: string) => {
  const categoriesCol = collection(db, 'users', userId, 'categories');
  
  // Check if loan categories already exist
  const loanGivenQuery = query(categoriesCol, where('name', '==', 'Loan Given'));
  const loanTakenQuery = query(categoriesCol, where('name', '==', 'Loan Taken'));
  
  const [loanGivenSnapshot, loanTakenSnapshot] = await Promise.all([
    getDocs(loanGivenQuery),
    getDocs(loanTakenQuery)
  ]);
  
  let loanGivenCategoryId: string;
  let loanTakenCategoryId: string;
  
  // Create "Loan Given" category if it doesn't exist
  if (loanGivenSnapshot.empty) {
    const loanGivenCategory: Omit<Category, 'id' | 'userId'> = {
      name: 'Loan Given',
      type: 'expense'
    };
    const loanGivenDoc = await addDoc(categoriesCol, loanGivenCategory);
    loanGivenCategoryId = loanGivenDoc.id;
  } else {
    loanGivenCategoryId = loanGivenSnapshot.docs[0].id;
  }
  
  // Create "Loan Taken" category if it doesn't exist
  if (loanTakenSnapshot.empty) {
    const loanTakenCategory: Omit<Category, 'id' | 'userId'> = {
      name: 'Loan Taken',
      type: 'income'
    };
    const loanTakenDoc = await addDoc(categoriesCol, loanTakenCategory);
    loanTakenCategoryId = loanTakenDoc.id;
  } else {
    loanTakenCategoryId = loanTakenSnapshot.docs[0].id;
  }
  
  return {
    loanGivenCategoryId,
    loanTakenCategoryId
  };
};

// Get the first available account for the user
export const getDefaultAccount = async (userId: string) => {
  const accountsCol = collection(db, 'users', userId, 'accounts');
  const accountsSnapshot = await getDocs(accountsCol);
  
  if (accountsSnapshot.empty) {
    // Create a default account if none exists
    const defaultAccount = {
      name: 'Default Account',
      type: 'bank' as const,
      initialBalance: 0,
      balance: 0
    };
    const accountDoc = await addDoc(accountsCol, defaultAccount);
    return accountDoc.id;
  }
  
  return accountsSnapshot.docs[0].id;
};

// Create transaction for a given loan
export const createLoanGivenTransaction = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanGivenCategoryId } = await findOrCreateLoanCategories(userId);
    const accountId = await getDefaultAccount(userId);
    
    const transaction: Omit<Transaction, 'id' | 'userId'> = {
      name: `Loan Given to ${loan.borrowerName}`,
      categoryId: loanGivenCategoryId,
      date: new Date().toISOString(),
      amount: loan.amount,
      type: 'expense',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true
    };
    
    return await addTransaction(userId, transaction);
  } catch (error) {
    console.error('Error creating loan given transaction:', error);
    throw error;
  }
};

// Create transaction for a taken loan
export const createLoanTakenTransaction = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanTakenCategoryId } = await findOrCreateLoanCategories(userId);
    const accountId = await getDefaultAccount(userId);
    
    const transaction: Omit<Transaction, 'id' | 'userId'> = {
      name: `Loan Taken from ${loan.borrowerName}`,
      categoryId: loanTakenCategoryId,
      date: new Date().toISOString(),
      amount: loan.amount,
      type: 'income',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true
    };
    
    return await addTransaction(userId, transaction);
  } catch (error) {
    console.error('Error creating loan taken transaction:', error);
    throw error;
  }
};

// Main function to create loan transaction
export const createLoanTransaction = async (
  userId: string,
  loan: { type: 'given' | 'taken'; borrowerName: string; amount: number; description: string }
) => {
  if (loan.type === 'given') {
    return await createLoanGivenTransaction(userId, loan);
  } else {
    return await createLoanTakenTransaction(userId, loan);
  }
};
