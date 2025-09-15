
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Budget } from '@/types';
import { useAuth } from './auth-context';
import { addBudget as addBudgetService, deleteBudget as deleteBudgetService, getBudgets, updateBudget as updateBudgetService } from '@/services/budgets';
import { onSnapshot } from 'firebase/firestore';

interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<string | undefined>;
  updateBudget: (id: string, updatedBudget: Partial<Omit<Budget, 'id' | 'userId'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getBudgets(user.uid);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userBudgets: Budget[] = [];
        querySnapshot.forEach((doc) => {
          userBudgets.push({ id: doc.id, ...doc.data() } as Budget);
        });
        setBudgets(userBudgets);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching budgets:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setBudgets([]);
      setLoading(false);
    }
  }, [user]);

  const addBudget = async (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newDoc = await addBudgetService(user.uid, budget);
    return newDoc?.id;
  };

  const updateBudget = async (id: string, updatedBudget: Partial<Omit<Budget, 'id' | 'userId'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateBudgetService(user.uid, id, updatedBudget);
  };
  
  const deleteBudget = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteBudgetService(user.uid, id);
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, loading }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
