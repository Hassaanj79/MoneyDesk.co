
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Account } from '@/types';
import { useAuth } from './auth-context';
import { addAccount as addAccountService, deleteAccount as deleteAccountService, getAccounts, updateAccount as updateAccountService } from '@/services/accounts';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
// import { addNotification, createNotificationMessage } from '@/services/notifications';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'userId'>) => Promise<string | undefined>;
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

  const addAccount = async (account: Omit<Account, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    // Set balance to initialBalance when creating account
    const accountWithBalance = {
      ...account,
      balance: account.initialBalance || 0
    };
    const newDoc = await addAccountService(user.uid, accountWithBalance);
    
    // Show success toast
    toast.success("Account created successfully!", {
      description: `${account.name} - ${account.type}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('account_created', {
    //   ...account,
    //   id: newDoc.id
    // });
    // 
    // await addNotification({
    //   type: 'account_created',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: newDoc.id,
    //   relatedEntityType: 'account'
    // });
    
    return newDoc?.id;
  };

  const updateAccount = async (id: string, updatedAccount: Partial<Omit<Account, 'id' | 'userId'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateAccountService(user.uid, id, updatedAccount);
    
    // Show success toast
    toast.success("Account updated successfully!", {
      description: `${updatedAccount.name || 'Account'} - ${updatedAccount.type || 'Account'}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('account_updated', {
    //   id,
    //   ...updatedAccount
    // });
    // 
    // await addNotification({
    //   type: 'account_updated',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'account'
    // });
  };
  
  const deleteAccount = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteAccountService(user.uid, id);
    
    // Show success toast
    toast.success("Account deleted successfully!");
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('account_deleted', {
    //   id,
    //   name: 'Account',
    //   type: 'Account'
    // });
    // 
    // await addNotification({
    //   type: 'account_deleted',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'account'
    // });
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
