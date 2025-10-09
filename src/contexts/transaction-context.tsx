"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction, Account } from '@/types';
import { useAuth } from './auth-context';
import { addTransaction as addTransactionService, deleteTransaction as deleteTransactionService, getTransactions, updateTransaction as updateTransactionService } from '@/services/transactions';
import { updateAccount as updateAccountService, getAccount } from '@/services/accounts';
import { Timestamp, onSnapshot, getDocs, query, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { aiCache } from '@/lib/ai-cache';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<string | undefined>;
  updateTransaction: (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  recalculateAllAccountBalances: () => Promise<void>;
  loading: boolean;
  refreshTrigger: number; // Add refresh trigger for forcing re-renders
  // AI Features removed for simplicity
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.uid) {
      setLoading(true);
      const q = getTransactions(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Firestore listener triggered, documents:', querySnapshot.docs.length);
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Safely handle date conversion
          let dateValue = data.date;
          if (dateValue && typeof dateValue.toDate === 'function') {
            dateValue = dateValue.toDate();
          } else if (typeof dateValue === 'string') {
            dateValue = new Date(dateValue);
          } else if (!(dateValue instanceof Date)) {
            dateValue = new Date();
          }
          
          // Safely handle createdAt conversion
          let createdAtValue = data.createdAt;
          if (createdAtValue && typeof createdAtValue.toDate === 'function') {
            createdAtValue = createdAtValue.toDate();
          } else if (!(createdAtValue instanceof Date)) {
            createdAtValue = new Date();
          }
          
          const transaction = { 
            id: doc.id, 
            ...data,
            date: dateValue,
            createdAt: createdAtValue
          } as Transaction;
          
          userTransactions.push(transaction);
          console.log('Processing transaction:', transaction.id, transaction.name, 'Date:', transaction.date);
        });
        // Sort by creation date, newest first
        userTransactions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        console.log('Setting transactions:', userTransactions.length);
        setTransactions(userTransactions);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
        // Handle permission errors gracefully
        if (error.code === 'permission-denied') {
          console.log('Permission denied for transactions, using empty array');
          setTransactions([]);
        } else {
          // Set empty transactions array on error to prevent UI issues
          setTransactions([]);
        }
      });

      return () => unsubscribe();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const updateAccountBalance = async (accountId: string, newTransaction: Transaction) => {
    try {
      // Check if account exists first
      const account = await getAccount(user!.uid, accountId);
      if (!account) {
        console.warn(`Account ${accountId} not found, skipping balance update`);
        return;
      }

      // Get current account balance starting from initial balance
      // Include the new transaction in the calculation
      const currentTransactions = transactions.filter(t => t.accountId === accountId);
      const allTransactions = [...currentTransactions, newTransaction];
      
      const updatedBalance = allTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, account.initialBalance || 0);

      // Update account balance in Firestore
      await updateAccountService(user!.uid, accountId, { balance: updatedBalance });
      
      console.log(`Updated account ${accountId} balance to ${updatedBalance}`);
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  };

  const recalculateAllAccountBalances = async () => {
    if (!user) return;

    try {
      // Get all accounts to access their initial balances
      const accountsSnapshot = await getDocs(query(collection(db, 'users', user.uid, 'accounts')));
      const accountsData: Record<string, { initialBalance: number }> = {};
      
      accountsSnapshot.forEach((doc) => {
        const data = doc.data();
        accountsData[doc.id] = { initialBalance: data.initialBalance || 0 };
      });

      // Group transactions by account
      const accountTransactionsMap = transactions.reduce((acc, transaction) => {
        if (!acc[transaction.accountId]) {
          acc[transaction.accountId] = [];
        }
        acc[transaction.accountId].push(transaction);
        return acc;
      }, {} as Record<string, Transaction[]>);

      // Recalculate balance for each account
      for (const [accountId, accountTransactions] of Object.entries(accountTransactionsMap)) {
        const initialBalance = accountsData[accountId]?.initialBalance || 0;
        const balance = accountTransactions.reduce((sum: number, transaction: Transaction) => {
          return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, initialBalance);

        await updateAccountService(user.uid, accountId, { balance });
      }

      // Handle accounts with no transactions (set balance to initial balance)
      for (const [accountId, accountData] of Object.entries(accountsData)) {
        if (!accountTransactionsMap[accountId]) {
          await updateAccountService(user.uid, accountId, { balance: accountData.initialBalance });
        }
      }
    } catch (error) {
      console.error('Error recalculating account balances:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const newDoc = await addTransactionService(user.uid, transaction);
      
      if (newDoc?.id) {
        // Create a temporary transaction object with the new ID for balance calculation
        const newTransaction: Transaction = {
          ...transaction,
          id: newDoc.id,
          userId: user.uid,
          createdAt: new Date()
        };
        
        // Update account balance if accountId exists
        if (transaction.accountId) {
          await updateAccountBalance(transaction.accountId, newTransaction);
        }

                // Clear AI insights cache to ensure fresh insights
                if (user) {
                  aiCache.clearUserCache(user.uid);
                }

                // Trigger refresh for components that depend on account balances
                setRefreshTrigger(prev => prev + 1);

                // Show success notification
                toast.success('Transaction added successfully!');
                
                console.log('Transaction added successfully:', newDoc.id);
                return newDoc.id;
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    if (!user) throw new Error("User not authenticated");
    
    await updateTransactionService(user.uid, id, updatedTransaction);
    
    // Update account balance if account changed
    if (updatedTransaction.accountId) {
      await updateAccountBalance(updatedTransaction.accountId!, {
        ...updatedTransaction,
        id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Transaction);
    }
    
    // Clear AI insights cache to ensure fresh insights
    aiCache.clearUserCache(user.uid);
    
    setRefreshTrigger(prev => prev + 1); // Trigger refresh for components that depend on account balances
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) throw new Error("Transaction not found");
    
    await deleteTransactionService(user.uid, id);
    
    // Update account balance after deleting transaction
    if (transaction.accountId) {
      await updateAccountBalance(transaction.accountId, transaction);
    }
    
    // Clear AI insights cache to ensure fresh insights
    aiCache.clearUserCache(user.uid);
    
    setRefreshTrigger(prev => prev + 1); // Trigger refresh for components that depend on account balances
  };


  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      addTransaction, 
      updateTransaction, 
      deleteTransaction, 
      recalculateAllAccountBalances,
      loading,
      refreshTrigger,
    }}>
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