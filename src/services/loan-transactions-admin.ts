import { adminDb } from '@/lib/firebase-admin';

/**
 * Server-side service to handle automatic transaction creation for loans using Admin SDK
 */

// Find or create loan categories using Admin SDK
export const findOrCreateLoanCategoriesAdmin = async (userId: string) => {
  const categoriesCol = adminDb.collection('users').doc(userId).collection('categories');
  
  // Check if loan categories already exist
  const loanGivenQuery = categoriesCol.where('name', '==', 'Loan Given');
  const loanTakenQuery = categoriesCol.where('name', '==', 'Loan Taken');
  
  const [loanGivenSnapshot, loanTakenSnapshot] = await Promise.all([
    loanGivenQuery.get(),
    loanTakenQuery.get()
  ]);
  
  let loanGivenCategoryId: string;
  let loanTakenCategoryId: string;
  
  // Create "Loan Given" category if it doesn't exist
  if (loanGivenSnapshot.empty) {
    const loanGivenCategory = {
      name: 'Loan Given',
      type: 'expense'
    };
    const loanGivenDoc = await categoriesCol.add(loanGivenCategory);
    loanGivenCategoryId = loanGivenDoc.id;
  } else {
    loanGivenCategoryId = loanGivenSnapshot.docs[0].id;
  }
  
  // Create "Loan Taken" category if it doesn't exist
  if (loanTakenSnapshot.empty) {
    const loanTakenCategory = {
      name: 'Loan Taken',
      type: 'income'
    };
    const loanTakenDoc = await categoriesCol.add(loanTakenCategory);
    loanTakenCategoryId = loanTakenDoc.id;
  } else {
    loanTakenCategoryId = loanTakenSnapshot.docs[0].id;
  }
  
  return {
    loanGivenCategoryId,
    loanTakenCategoryId
  };
};

// Get the first available account for the user using Admin SDK
export const getDefaultAccountAdmin = async (userId: string) => {
  const accountsCol = adminDb.collection('users').doc(userId).collection('accounts');
  const accountsSnapshot = await accountsCol.get();
  
  if (accountsSnapshot.empty) {
    // Create a default account if none exists
    const defaultAccount = {
      name: 'Default Account',
      type: 'bank',
      initialBalance: 0,
      balance: 0
    };
    const accountDoc = await accountsCol.add(defaultAccount);
    return accountDoc.id;
  }
  
  return accountsSnapshot.docs[0].id;
};

// Create transaction for a given loan using Admin SDK
export const createLoanGivenTransactionAdmin = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanGivenCategoryId } = await findOrCreateLoanCategoriesAdmin(userId);
    const accountId = await getDefaultAccountAdmin(userId);
    
    const transaction = {
      name: `Loan Given to ${loan.borrowerName}`,
      categoryId: loanGivenCategoryId,
      date: new Date(),
      amount: loan.amount,
      type: 'expense',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true,
      createdAt: new Date()
    };
    
    const transactionsCol = adminDb.collection('users').doc(userId).collection('transactions');
    return await transactionsCol.add(transaction);
  } catch (error) {
    console.error('Error creating loan given transaction:', error);
    throw error;
  }
};

// Create transaction for a taken loan using Admin SDK
export const createLoanTakenTransactionAdmin = async (
  userId: string, 
  loan: { borrowerName: string; amount: number; description: string }
) => {
  try {
    const { loanTakenCategoryId } = await findOrCreateLoanCategoriesAdmin(userId);
    const accountId = await getDefaultAccountAdmin(userId);
    
    const transaction = {
      name: `Loan Taken from ${loan.borrowerName}`,
      categoryId: loanTakenCategoryId,
      date: new Date(),
      amount: loan.amount,
      type: 'income',
      accountId: accountId,
      isRecurring: false,
      isLoanGenerated: true,
      createdAt: new Date()
    };
    
    const transactionsCol = adminDb.collection('users').doc(userId).collection('transactions');
    return await transactionsCol.add(transaction);
  } catch (error) {
    console.error('Error creating loan taken transaction:', error);
    throw error;
  }
};

// Main function to create loan transaction using Admin SDK
export const createLoanTransactionAdmin = async (
  userId: string,
  loan: { type: 'given' | 'taken'; borrowerName: string; amount: number; description: string }
) => {
  if (loan.type === 'given') {
    return await createLoanGivenTransactionAdmin(userId, loan);
  } else {
    return await createLoanTakenTransactionAdmin(userId, loan);
  }
};
