"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Loan } from '@/types';
import { useAuth } from './auth-context';
import { addLoan as addLoanService, deleteLoan as deleteLoanService, getLoans, updateLoan as updateLoanService } from '@/services/loans';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface LoanContextType {
  loans: Loan[];
  addLoan: (loan: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateLoan: (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  loading: boolean;
  refreshTrigger: number;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getLoans(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userLoans: Loan[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userLoans.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
          } as Loan);
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
    
    try {
      console.log('Adding loan:', loan);
      const newDoc = await addLoanService(user.uid, loan);
      console.log('Loan service response:', newDoc);
      
      if (newDoc?.id) {
        // Optimistically update the local state immediately
        const newLoan: Loan = {
          id: newDoc.id,
          ...loan,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setLoans(prevLoans => [newLoan, ...prevLoans]);
        
        // Trigger refresh for components that depend on loan data
        setRefreshTrigger(prev => prev + 1);
        
        // Show success notification
        toast.success('Loan added successfully!');
        
        console.log('Loan added successfully:', newDoc.id);
        return newDoc.id;
      } else {
        console.error('No document ID returned from addLoanService');
        throw new Error('Failed to create loan - no ID returned');
      }
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  };

  const updateLoan = async (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await updateLoanService(user.uid, id, updatedLoan);
      
      // Trigger refresh for components that depend on loan data
      setRefreshTrigger(prev => prev + 1);
      
      // Show success notification
      toast.success('Loan updated successfully!');
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  };

  const deleteLoan = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await deleteLoanService(user.uid, id);
      
      // Trigger refresh for components that depend on loan data
      setRefreshTrigger(prev => prev + 1);
      
      // Show success notification
      toast.success('Loan deleted successfully!');
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  };

  return (
    <LoanContext.Provider value={{ loans, addLoan, updateLoan, deleteLoan, loading, refreshTrigger }}>
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