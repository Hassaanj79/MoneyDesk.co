"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Loan } from '@/types';
import { useAuth } from './auth-context';
import { addLoan as addLoanService, deleteLoan as deleteLoanService, getLoans, updateLoan as updateLoanService } from '@/services/loans';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
// import { addNotification, createNotificationMessage } from '@/services/notifications';

interface LoanContextType {
  loans: Loan[];
  addLoan: (loan: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateLoan: (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  loading: boolean;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getLoans(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userLoans: Loan[] = [];
        querySnapshot.forEach((doc) => {
          userLoans.push({ id: doc.id, ...doc.data() } as Loan);
        });
        setLoans(userLoans);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching loans:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoans([]);
      setLoading(false);
    }
  }, [user]);

  const addLoan = async (loan: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error("User not authenticated");
    const newDoc = await addLoanService(user.uid, loan);
    
      // Show success toast
      toast.success(`${loan.type === 'given' ? 'Loan given' : 'Loan taken'} successfully!`, {
        description: `${loan.description} - ${loan.amount}`
      });
      
      // Create notification (disabled)
      // const notificationData = createNotificationMessage('loan_created', {
      //   ...loan,
      //   id: newDoc.id
      // });
      
      // await addNotification({
      //   type: 'loan_created',
      //   title: notificationData.title,
      //   message: notificationData.message,
      //   navigationPath: notificationData.navigationPath,
      //   navigationParams: notificationData.navigationParams,
      //   relatedEntityId: newDoc.id,
      //   relatedEntityType: 'loan'
      // });
    
    return newDoc?.id;
  };

  const updateLoan = async (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateLoanService(user.uid, id, updatedLoan);
    
    // Show success toast
    toast.success("Loan updated successfully!", {
      description: `${updatedLoan.description || 'Loan'} - ${updatedLoan.amount}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('loan_updated', {
    //   id,
    //   ...updatedLoan
    // });
    // 
    // await addNotification({
    //   type: 'loan_updated',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'loan'
    // });
  };
  
  const deleteLoan = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteLoanService(user.uid, id);
    
    // Show success toast
    toast.success("Loan deleted successfully!");
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('loan_deleted', {
    //   id,
    //   borrowerName: 'Loan',
    //   amount: 0
    // });
    // 
    // await addNotification({
    //   type: 'loan_deleted',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'loan'
    // });
  };

  return (
    <LoanContext.Provider value={{ loans, addLoan, updateLoan, deleteLoan, loading }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoans must be used within a LoanProvider');
  }
  return context;
};
