"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction, Account } from '@/types';
import { useAuth } from './auth-context';
import { addTransaction as addTransactionService, deleteTransaction as deleteTransactionService, getTransactions, updateTransaction as updateTransactionService } from '@/services/transactions';
import { updateAccount as updateAccountService } from '@/services/accounts';
import { Timestamp, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

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

  const updateAccountBalance = async (accountId: string, transaction: Transaction) => {
    try {
      // Get current account balance
      const currentTransactions = transactions.filter(t => t.accountId === accountId);
      const currentBalance = currentTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);

      // Update account balance in Firestore
      await updateAccountService(user!.uid, accountId, { balance: currentBalance });
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  };

  const recalculateAllAccountBalances = async () => {
    if (!user) return;

    try {
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
        const balance = accountTransactions.reduce((sum: number, transaction: Transaction) => {
          return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);

        await updateAccountService(user.uid, accountId, { balance });
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

  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      addTransaction, 
      updateTransaction, 
      deleteTransaction, 
      recalculateAllAccountBalances,
      loading 
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