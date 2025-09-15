"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Loan } from '@/types';
import { useAuth } from './auth-context';
import { addLoan as addLoanService, deleteLoan as deleteLoanService, getLoans, updateLoan as updateLoanService } from '@/services/loans';
import { onSnapshot } from 'firebase/firestore';

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
    return newDoc?.id;
  };

  const updateLoan = async (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateLoanService(user.uid, id, updatedLoan);
  };
  
  const deleteLoan = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteLoanService(user.uid, id);
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
