"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DraftTransaction } from '@/types';
import { 
  getDraftTransactions, 
  getPendingDraftTransactions,
  addDraftTransaction,
  updateDraftTransaction,
  approveDraftTransaction,
  rejectDraftTransaction,
  deleteDraftTransaction,
  createDraftFromRecurringTransaction,
  createDraftFromLoanInstallment
} from '@/services/draft-transactions';
import { useAuth } from './auth-context';
import { addTransaction } from '@/services/transactions';

interface DraftTransactionContextType {
  draftTransactions: DraftTransaction[];
  pendingDrafts: DraftTransaction[];
  loading: boolean;
  error: string | null;
  addDraft: (draft: Omit<DraftTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDraft: (id: string, updates: Partial<DraftTransaction>) => Promise<void>;
  approveDraft: (id: string) => Promise<void>;
  rejectDraft: (id: string) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  createFromRecurring: (sourceTransaction: any, dueDate: string) => Promise<string>;
  createFromLoanInstallment: (loanId: string, installment: any, accountId: string) => Promise<string>;
  refreshDrafts: () => Promise<void>;
}

const DraftTransactionContext = createContext<DraftTransactionContextType | undefined>(undefined);

export const useDraftTransactions = () => {
  const context = useContext(DraftTransactionContext);
  if (context === undefined) {
    throw new Error('useDraftTransactions must be used within a DraftTransactionProvider');
  }
  return context;
};

interface DraftTransactionProviderProps {
  children: React.ReactNode;
}

export const DraftTransactionProvider: React.FC<DraftTransactionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [draftTransactions, setDraftTransactions] = useState<DraftTransaction[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<DraftTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [allDrafts, pending] = await Promise.all([
        getDraftTransactions(user.uid),
        getPendingDraftTransactions(user.uid)
      ]);
      
      setDraftTransactions(allDrafts);
      setPendingDrafts(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch draft transactions');
      console.error('Error fetching draft transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [user?.uid]);

  const addDraft = async (draft: Omit<DraftTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const id = await addDraftTransaction(draft);
      await fetchDrafts(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add draft transaction');
      throw err;
    }
  };

  const updateDraft = async (id: string, updates: Partial<DraftTransaction>): Promise<void> => {
    try {
      await updateDraftTransaction(id, updates);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft transaction');
      throw err;
    }
  };

  const approveDraft = async (id: string): Promise<void> => {
    try {
      const draft = draftTransactions.find(d => d.id === id);
      if (!draft) throw new Error('Draft transaction not found');

      // Create the actual transaction
      await addTransaction({
        name: draft.name,
        categoryId: draft.categoryId,
        date: draft.date,
        amount: draft.amount,
        type: draft.type,
        accountId: draft.accountId,
      });

      // Mark draft as approved
      await approveDraftTransaction(id);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve draft transaction');
      throw err;
    }
  };

  const rejectDraft = async (id: string): Promise<void> => {
    try {
      await rejectDraftTransaction(id);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject draft transaction');
      throw err;
    }
  };

  const deleteDraft = async (id: string): Promise<void> => {
    try {
      await deleteDraftTransaction(id);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft transaction');
      throw err;
    }
  };

  const createFromRecurring = async (sourceTransaction: any, dueDate: string): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      const id = await createDraftFromRecurringTransaction(user.uid, sourceTransaction, dueDate);
      await fetchDrafts(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft from recurring transaction');
      throw err;
    }
  };

  const createFromLoanInstallment = async (loanId: string, installment: any, accountId: string): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      const id = await createDraftFromLoanInstallment(user.uid, loanId, installment, accountId);
      await fetchDrafts(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft from loan installment');
      throw err;
    }
  };

  const refreshDrafts = async (): Promise<void> => {
    await fetchDrafts();
  };

  const value: DraftTransactionContextType = {
    draftTransactions,
    pendingDrafts,
    loading,
    error,
    addDraft,
    updateDraft,
    approveDraft,
    rejectDraft,
    deleteDraft,
    createFromRecurring,
    createFromLoanInstallment,
    refreshDrafts,
  };

  return (
    <DraftTransactionContext.Provider value={value}>
      {children}
    </DraftTransactionContext.Provider>
  );
};

