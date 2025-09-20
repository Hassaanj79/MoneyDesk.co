
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Budget } from '@/types';
import { useAuth } from './auth-context';
import { addBudget as addBudgetService, deleteBudget as deleteBudgetService, getBudgets, updateBudget as updateBudgetService } from '@/services/budgets';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
// import { addNotification, createNotificationMessage } from '@/services/notifications';

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
          const data = doc.data();
          // Convert Firestore Timestamps to Date objects
          const budget: Budget = {
            id: doc.id,
            userId: data.userId,
            name: data.name,
            amount: data.amount,
            period: data.period,
            categoryId: data.categoryId,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
          };
          userBudgets.push(budget);
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
    
    // Show success toast
    toast.success("Budget created successfully!", {
      description: `${budget.name} - ${budget.amount}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('budget_created', {
    //   ...budget,
    //   id: newDoc.id
    // });
    // 
    // await addNotification({
    //   type: 'budget_created',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: newDoc.id,
    //   relatedEntityType: 'budget'
    // });
    
    return newDoc?.id;
  };

  const updateBudget = async (id: string, updatedBudget: Partial<Omit<Budget, 'id' | 'userId'>>) => {
     if (!user) throw new Error("User not authenticated");
    await updateBudgetService(user.uid, id, updatedBudget);
    
    // Show success toast
    toast.success("Budget updated successfully!", {
      description: `${updatedBudget.name || 'Budget'} - ${updatedBudget.amount}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('budget_updated', {
    //   id,
    //   ...updatedBudget
    // });
    // 
    // await addNotification({
    //   type: 'budget_updated',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'budget'
    // });
  };
  
  const deleteBudget = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteBudgetService(user.uid, id);
    
    // Show success toast
    toast.success("Budget deleted successfully!");
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('budget_deleted', {
    //   id,
    //   name: 'Budget',
    //   amount: 0
    // });
    // 
    // await addNotification({
    //   type: 'budget_deleted',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'budget'
    // });
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
