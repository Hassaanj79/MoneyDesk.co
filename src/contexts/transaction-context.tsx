
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction } from '@/types';
import { useAuth } from './auth-context';
import { addTransaction as addTransactionService, deleteTransaction as deleteTransactionService, getTransactions, updateTransaction as updateTransactionService } from '@/services/transactions';
import { Timestamp, onSnapshot } from 'firebase/firestore';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<string | undefined>;
  updateTransaction: (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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
    return newDoc?.id;
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateTransactionService(user.uid, id, updatedTransaction);
  };
  
  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteTransactionService(user.uid, id);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, loading }}>
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
