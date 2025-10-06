"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction, Account } from '@/types';
import { useAuth } from './auth-context';
import { addTransaction as addTransactionService, deleteTransaction as deleteTransactionService, getTransactions, updateTransaction as updateTransactionService } from '@/services/transactions';
import { updateAccount as updateAccountService, getAccount } from '@/services/accounts';
import { Timestamp, onSnapshot, getDocs, query, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAIFeatures } from '@/hooks/use-ai-features';
import { aiCache } from '@/lib/ai-cache';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<string | undefined>;
  updateTransaction: (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  recalculateAllAccountBalances: () => Promise<void>;
  loading: boolean;
  // AI Features
  categorizeTransaction: (transaction: Partial<Transaction>) => string | null;
  detectDuplicate: (transaction: Partial<Transaction>) => boolean;
  generateSpendingInsights: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const aiFeatures = useAIFeatures();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getTransactions(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userTransactions.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
          } as unknown as Transaction);
        });
        // Sort by creation date, newest first
        userTransactions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
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
    
    const newDoc = await addTransactionService(user.uid, transaction);
    
    // Update account balance after adding transaction
    if (newDoc?.id && transaction.accountId) {
      // Create a temporary transaction object with the new ID for balance calculation
      const newTransaction: Transaction = {
        ...transaction,
        id: newDoc.id,
        userId: user.uid,
        createdAt: new Date() // Add createdAt for immediate sorting
      };
      
      // Immediately add to local state for instant UI update
      setTransactions(prev => {
        // Check if transaction already exists to prevent duplicates
        const exists = prev.some(t => t.id === newTransaction.id);
        if (exists) {
          console.log('Transaction already exists in state, skipping duplicate');
          return prev;
        }
        return [newTransaction, ...prev];
      });
      
      // Update account balance immediately with the new transaction
      await updateAccountBalance(transaction.accountId, newTransaction);

      // Clear AI cache to ensure fresh insights
      aiCache.clear();

      // Generate smart notifications for the new transaction
      try {
        const notifications = aiFeatures.generateTransactionNotifications(
          newTransaction,
          transactions,
          [] // budgets - can be added later
        );
        
        // Show notifications
        notifications.forEach(notification => {
          if (notification.type === 'warning') {
            toast.warning(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          } else if (notification.type === 'info') {
            toast.info(notification.title, {
              description: notification.message,
              duration: 3000,
            });
          } else {
            toast.success(notification.title, {
              description: notification.message,
              duration: 3000,
            });
          }
        });
      } catch (error) {
        console.error('Error generating smart notifications:', error);
      }
    }
    
    return newDoc?.id;
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
  };

  // AI Features
  const categorizeTransaction = (transaction: Partial<Transaction>) => {
    return aiFeatures.categorizeTransaction(transaction);
  };

  const detectDuplicate = (transaction: Partial<Transaction>) => {
    const result = aiFeatures.detectDuplicate(transaction, transactions);
    return result.isDuplicate;
  };

  const generateSpendingInsights = () => {
    const insights = aiFeatures.generateSpendingInsights(transactions);
    // You can add logic here to display insights or trigger notifications
    console.log('Generated spending insights:', insights);
  };

  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      addTransaction, 
      updateTransaction, 
      deleteTransaction, 
      recalculateAllAccountBalances,
      loading,
      // AI Features
      categorizeTransaction,
      detectDuplicate,
      generateSpendingInsights
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