
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Account } from '@/types';
import { useAuth } from './auth-context';
import { addAccount as addAccountService, deleteAccount as deleteAccountService, getAccounts, updateAccount as updateAccountService } from '@/services/accounts';
import { onSnapshot } from 'firebase/firestore';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'userId' | 'balance'>) => Promise<string | undefined>;
  updateAccount: (id: string, updatedAccount: Partial<Omit<Account, 'id' | 'userId'>>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getAccounts(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userAccounts: Account[] = [];
        querySnapshot.forEach((doc) => {
          userAccounts.push({ id: doc.id, ...doc.data() } as Account);
        });
        setAccounts(userAccounts);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching accounts:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  const addAccount = async (account: Omit<Account, 'id' | 'userId' | 'balance'>) => {
    if (!user) throw new Error("User not authenticated");
    const newDoc = await addAccountService(user.uid, account);
    return newDoc?.id;
  };

  const updateAccount = async (id: string, updatedAccount: Partial<Omit<Account, 'id' | 'userId'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateAccountService(user.uid, id, updatedAccount);
  };
  
  const deleteAccount = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteAccountService(user.uid, id);
  };

  return (
    <AccountContext.Provider value={{ accounts, addAccount, updateAccount, deleteAccount, loading }}>
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
