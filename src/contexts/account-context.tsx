"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Account } from '@/types';
import { useAuth } from './auth-context';
import { addAccount as addAccountService, deleteAccount as deleteAccountService, getAccounts, updateAccount as updateAccountService } from '@/services/accounts';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'userId'>) => Promise<string | undefined>;
  updateAccount: (id: string, updatedAccount: Partial<Omit<Account, 'id' | 'userId'>>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  loading: boolean;
  refreshTrigger: number; // Add refresh trigger for forcing re-renders
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getAccounts(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userAccounts: Account[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure balance is set, defaulting to initialBalance if not present
          userAccounts.push({ 
            id: doc.id, 
            ...data,
            balance: data.balance !== undefined ? data.balance : data.initialBalance || 0
          } as Account);
        });
        setAccounts(userAccounts);
        setLoading(false);
        // Trigger refresh when accounts are updated
        setRefreshTrigger(prev => prev + 1);
      }, (error) => {
        console.error("Error fetching accounts:", error);
        setLoading(false);
        // Set empty accounts array on error to prevent UI issues
        setAccounts([]);
      });

      return () => unsubscribe();
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  const addAccount = async (account: Omit<Account, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Set balance to initialBalance when creating account
      const accountWithBalance = {
        ...account,
        balance: account.initialBalance || 0
      };
      const newDoc = await addAccountService(user.uid, accountWithBalance);
      toast.success("Account added successfully!");
      return newDoc?.id;
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error("Failed to add account.");
      throw error;
    }
  };

  const updateAccount = async (id: string, updatedAccount: Partial<Omit<Account, 'id' | 'userId'>>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await updateAccountService(user.uid, id, updatedAccount);
      toast.success("Account updated successfully!");
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error("Failed to update account.");
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await deleteAccountService(user.uid, id);
      toast.success("Account deleted successfully!");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account.");
      throw error;
    }
  };

  return (
    <AccountContext.Provider value={{ accounts, addAccount, updateAccount, deleteAccount, loading, refreshTrigger }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within a AccountProvider');
  }
  return context;
};