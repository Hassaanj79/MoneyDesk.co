
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction } from '@/types';
import { useAuth } from './auth-context';
import { addTransaction as addTransactionService, deleteTransaction as deleteTransactionService, getTransactions, updateTransaction as updateTransactionService } from '@/services/transactions';
import { updateAccount as updateAccountService } from '@/services/accounts';
import { Timestamp, onSnapshot } from 'firebase/firestore';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<string | undefined>;
  updateTransaction: (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  recalculateAllAccountBalances: () => Promise<void>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Helper function to update account balance
  const updateAccountBalance = async (accountId: string, newTransaction?: Transaction) => {
    if (!user) return;
    
    try {
      // Get the account's initial balance from the account context
      // We need to import useAccounts or get the account data differently
      // For now, let's get it from the accounts service
      const { getAccount } = await import('@/services/accounts');
      const account = await getAccount(user.uid, accountId);
      
      if (!account) {
        console.error('Account not found:', accountId);
        return;
      }
      
      // Start with the initial balance
      const initialBalance = account.initialBalance || 0;
      
      // Get current account balance from all transactions for this account
      let accountTransactions = transactions.filter(t => t.accountId === accountId);
      
      // If we have a new transaction, include it in the calculation
      if (newTransaction) {
        accountTransactions = [...accountTransactions, newTransaction];
      }
      
      const currentBalance = accountTransactions.reduce((balance, transaction) => {
        if (transaction.type === 'income') {
          return balance + transaction.amount;
        } else {
          return balance - transaction.amount;
        }
      }, initialBalance);

      // Update the account balance in Firestore
      await updateAccountService(user.uid, accountId, { balance: currentBalance });
      console.log(`Updated account ${accountId} balance to ${currentBalance} (initial: ${initialBalance})`);
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getTransactions(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // This handles both Timestamp and string dates from Firestore
          const date = data.date.toDate ? (data.date as Timestamp).toDate().toISOString() : data.date;
          userTransactions.push({ 
            id: doc.id, 
            ...data,
            date: date,
          } as Transaction);
        });
        setTransactions(userTransactions);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newDoc = await addTransactionService(user.uid, transaction);
    
    // Update account balance after adding transaction
    if (newDoc?.id && transaction.accountId) {
      // Create a temporary transaction object with the new ID for balance calculation
      const newTransaction: Transaction = {
        ...transaction,
        id: newDoc.id,
        userId: user.uid
      };
      
      // Update account balance immediately with the new transaction
      await updateAccountBalance(transaction.accountId, newTransaction);
    }
    
    return newDoc?.id;
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    if (!user) throw new Error("User not authenticated");
    
    // Get the original transaction to find the account
    const originalTransaction = transactions.find(t => t.id === id);
    
    await updateTransactionService(user.uid, id, updatedTransaction);
    
    // Update account balance after updating transaction
    if (originalTransaction?.accountId) {
      // Wait for the Firestore listener to update the local state
      setTimeout(() => {
        updateAccountBalance(originalTransaction.accountId);
      }, 200);
    }
    
    // If account was changed, update the new account balance too
    if (updatedTransaction.accountId && updatedTransaction.accountId !== originalTransaction?.accountId) {
      setTimeout(() => {
        updateAccountBalance(updatedTransaction.accountId);
      }, 200);
    }
  };
  
  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    // Get the transaction to find the account before deleting
    const transactionToDelete = transactions.find(t => t.id === id);
    
    await deleteTransactionService(user.uid, id);
    
    // Update account balance after deleting transaction
    if (transactionToDelete?.accountId) {
      // Wait for the Firestore listener to update the local state
      setTimeout(() => {
        updateAccountBalance(transactionToDelete.accountId);
      }, 200);
    }
  };

  const recalculateAllAccountBalances = async () => {
    if (!user) return;
    
    try {
      // Get all accounts
      const { getAccounts } = await import('@/services/accounts');
      const accountsQuery = getAccounts(user.uid);
      const accountsSnapshot = await import('firebase/firestore').then(firestore => 
        firestore.getDocs(accountsQuery)
      );
      
      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      
      // Recalculate balance for each account
      for (const account of accounts) {
        await updateAccountBalance(account.id);
      }
      
      console.log('Recalculated all account balances');
    } catch (error) {
      console.error('Error recalculating account balances:', error);
    }
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, recalculateAllAccountBalances, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
