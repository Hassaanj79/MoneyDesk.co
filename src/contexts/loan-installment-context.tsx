"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { 
  addLoanInstallment, 
  updateLoanInstallment, 
  deleteLoanInstallment, 
  getLoanInstallments, 
  payInstallment,
  generateInstallments 
} from '@/services/loan-installments';
import type { LoanInstallment } from '@/types';
import { toast } from 'sonner';
// import { addNotification, createNotificationMessage } from '@/services/notifications';

interface LoanInstallmentContextType {
  installments: LoanInstallment[];
  loading: boolean;
  addInstallment: (installment: Omit<LoanInstallment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateInstallment: (id: string, updates: Partial<Omit<LoanInstallment, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  payInstallmentPayment: (id: string, paidDate?: string) => Promise<void>;
  generateLoanInstallments: (loanId: string, loan: {
    amount: number;
    installmentCount: number;
    installmentFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    interestRate?: number;
  }) => Promise<number>;
  getInstallmentsByLoan: (loanId: string) => LoanInstallment[];
}

const LoanInstallmentContext = createContext<LoanInstallmentContextType | undefined>(undefined);

export const LoanInstallmentProvider = ({ children }: { children: ReactNode }) => {
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInstallments();
    } else {
      setInstallments([]);
      setLoading(false);
    }
  }, [user]);

  const fetchInstallments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getLoanInstallments(user.uid);
      setInstallments(data);
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInstallment = async (installment: Omit<LoanInstallment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const id = await addLoanInstallment(user.uid, installment);
      await fetchInstallments(); // Refresh the list
      return id;
    } catch (error) {
      console.error('Error adding installment:', error);
      throw error;
    }
  };

  const updateInstallment = async (id: string, updates: Partial<Omit<LoanInstallment, 'id' | 'userId' | 'createdAt'>>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await updateLoanInstallment(user.uid, id, updates);
      await fetchInstallments(); // Refresh the list
    } catch (error) {
      console.error('Error updating installment:', error);
      throw error;
    }
  };

  const deleteInstallment = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await deleteLoanInstallment(user.uid, id);
      await fetchInstallments(); // Refresh the list
    } catch (error) {
      console.error('Error deleting installment:', error);
      throw error;
    }
  };

  const payInstallmentPayment = async (id: string, paidDate?: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await payInstallment(user.uid, id, paidDate);
      await fetchInstallments(); // Refresh the list
      
    // Show success toast
    toast.success("Installment paid successfully!", {
      description: "Payment has been recorded"
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('installment_paid', {
    //   loanId: installment.loanId,
    //   installmentNumber: installment.installmentNumber,
    //   amount: installment.amount
    // });
    // 
    // await addNotification({
    //   type: 'installment_paid',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: installment.loanId,
    //   relatedEntityType: 'loan'
    // });
    } catch (error) {
      console.error('Error paying installment:', error);
      throw error;
    }
  };

  const generateLoanInstallments = async (loanId: string, loan: {
    amount: number;
    installmentCount: number;
    installmentFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    interestRate?: number;
  }) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const count = await generateInstallments(user.uid, loanId, loan);
      await fetchInstallments(); // Refresh the list
      return count;
    } catch (error) {
      console.error('Error generating installments:', error);
      throw error;
    }
  };

  const getInstallmentsByLoan = (loanId: string) => {
    return installments.filter(installment => installment.loanId === loanId);
  };

  return (
    <LoanInstallmentContext.Provider value={{
      installments,
      loading,
      addInstallment,
      updateInstallment,
      deleteInstallment,
      payInstallmentPayment,
      generateLoanInstallments,
      getInstallmentsByLoan,
    }}>
      {children}
    </LoanInstallmentContext.Provider>
  );
};

export const useLoanInstallments = () => {
  const context = useContext(LoanInstallmentContext);
  if (context === undefined) {
    throw new Error('useLoanInstallments must be used within a LoanInstallmentProvider');
  }
  return context;
};
