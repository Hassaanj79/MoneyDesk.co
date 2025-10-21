import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { addTransaction } from './transactions';
import type { Transaction, Category } from '@/types';

/**
 * Service to handle automatic transaction creation for loans
 */

// Find loan categories
export const findLoanCategories = async (userId: string) => {
  const categoriesCol = collection(db, 'users', userId, 'categories');
  
  // Check if loan categories exist
  const loanGivenQuery = query(categoriesCol, where('name', '==', 'Loan Given'));
  const loanTakenQuery = query(categoriesCol, where('name', '==', 'Loan Taken'));
  const loanReceivedQuery = query(categoriesCol, where('name', '==', 'Loan Received'));
  const loanRepayedQuery = query(categoriesCol, where('name', '==', 'Loan Repayed'));
  
  const [loanGivenSnapshot, loanTakenSnapshot, loanReceivedSnapshot, loanRepayedSnapshot] = await Promise.all([
    getDocs(loanGivenQuery),
    getDocs(loanTakenQuery),
    getDocs(loanReceivedQuery),
    getDocs(loanRepayedQuery)
  ]);
  
  return {
    loanGivenCategoryId: loanGivenSnapshot.docs[0]?.id,
    loanTakenCategoryId: loanTakenSnapshot.docs[0]?.id,
    loanReceivedCategoryId: loanReceivedSnapshot.docs[0]?.id,
    loanRepayedCategoryId: loanRepayedSnapshot.docs[0]?.id
  };
};

// Get the first available account for the user
export const getDefaultAccount = async (userId: string) => {
  const accountsCol = collection(db, 'users', userId, 'accounts');
  const accountsSnapshot = await getDocs(accountsCol);
  
  if (accountsSnapshot.empty) {
    // Don't auto-create accounts - let users create their own
    throw new Error('No accounts found. Please create an account first.');
  }
  
  return accountsSnapshot.docs[0].id;
};

// Create transaction for a given loan
export const createLoanGivenTransaction = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanGivenCategoryId } = await findLoanCategories(userId);
    if (!loanGivenCategoryId) {
      throw new Error('Loan Given category not found. Please ensure default categories are created.');
    }
    
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
    const { loanTakenCategoryId } = await findLoanCategories(userId);
    if (!loanTakenCategoryId) {
      throw new Error('Loan Taken category not found. Please ensure default categories are created.');
    }
    
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

// Create transaction for loan received (repayment of loan given)
export const createLoanReceivedTransaction = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanReceivedCategoryId } = await findLoanCategories(userId);
    if (!loanReceivedCategoryId) {
      throw new Error('Loan Received category not found. Please ensure default categories are created.');
    }
    
    const accountId = await getDefaultAccount(userId);
    
    const transaction: Omit<Transaction, 'id' | 'userId'> = {
      name: `Loan Received from ${loan.borrowerName}`,
      categoryId: loanReceivedCategoryId,
      date: new Date().toISOString(),
      amount: loan.amount,
      type: 'income',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true
    };
    
    return await addTransaction(userId, transaction);
  } catch (error) {
    console.error('Error creating loan received transaction:', error);
    throw error;
  }
};

// Create transaction for loan repayment (repayment of loan taken)
export const createLoanRepayedTransaction = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanRepayedCategoryId } = await findLoanCategories(userId);
    if (!loanRepayedCategoryId) {
      throw new Error('Loan Repayed category not found. Please ensure default categories are created.');
    }
    
    const accountId = await getDefaultAccount(userId);
    
    const transaction: Omit<Transaction, 'id' | 'userId'> = {
      name: `Loan Repayed to ${loan.borrowerName}`,
      categoryId: loanRepayedCategoryId,
      date: new Date().toISOString(),
      amount: loan.amount,
      type: 'expense',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true
    };
    
    return await addTransaction(userId, transaction);
  } catch (error) {
    console.error('Error creating loan repayed transaction:', error);
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

// Main function to create loan repayment transaction
export const createLoanRepaymentTransaction = async (
  userId: string,
  loan: { type: 'received' | 'repayed'; borrowerName: string; amount: number; description: string }
) => {
  if (loan.type === 'received') {
    return await createLoanReceivedTransaction(userId, loan);
  } else {
    return await createLoanRepayedTransaction(userId, loan);
  }
};
