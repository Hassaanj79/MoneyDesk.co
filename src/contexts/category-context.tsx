
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Category, Transaction } from '@/types';
import { useAuth } from './auth-context';
import { addCategory as addCategoryService, getCategories, updateCategory as updateCategoryService, deleteCategory as deleteCategoryService, deleteCategoriesBulk as deleteCategoriesBulkService } from '@/services/categories';
import { onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
// import { addNotification, createNotificationMessage } from '@/services/notifications';

interface CategoryContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<string | undefined>;
  updateCategory: (categoryId: string, category: Partial<Omit<Category, 'id' | 'userId'>>) => Promise<void>;
  deleteCategory: (categoryId: string, transactions: Transaction[]) => Promise<void>;
  deleteCategoriesBulk: (categoryIds: string[], transactions: Transaction[]) => Promise<void>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const defaultCategories: Omit<Category, 'id'|'userId'>[] = [
    // Income categories
    { name: "Investment", type: "income" },
    { name: "Salary", type: "income" },
    { name: "Freelance", type: "income" },
    { name: "Business", type: "income" },
    { name: "Loan Taken", type: "income" },
    { name: "Loan Received", type: "income" },
    
    // Expense categories
    { name: "Shopping", type: "expense" },
    { name: "Groceries", type: "expense" },
    { name: "Housing", type: "expense" },
    { name: "Entertainment", type: "expense" },
    { name: "Loan Given", type: "expense" },
    { name: "Loan Repayed", type: "expense" },
];


export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = getCategories(user.uid);
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        if (querySnapshot.empty) {
          // Create default categories for new user
          for (const cat of defaultCategories) {
            await addCategoryService(user.uid, cat);
          }
        } else {
          const userCategories: Category[] = [];
          querySnapshot.forEach((doc) => {
            userCategories.push({ id: doc.id, ...doc.data() } as Category);
          });
          setCategories(userCategories);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [user]);

  const addCategory = async (category: Omit<Category, 'id' | 'userId'>) => {
    // Temporary workaround for testing - use a mock user ID if no user is authenticated
    const userId = user?.uid || 'test-user-id';
    
    try {
      const newDoc = await addCategoryService(userId, category);
      
    // Show success toast
    toast.success("Category created successfully!", {
      description: `${category.name} - ${category.type}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('category_created', {
    //   ...category,
    //   id: newDoc.id
    // });
    // 
    // await addNotification({
    //   type: 'category_created',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: newDoc.id,
    //   relatedEntityType: 'category'
    // });
      
      return newDoc?.id;
    } catch (error) {
      console.error('Error in addCategoryService:', error)
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, category: Partial<Omit<Category, 'id' | 'userId'>>) => {
    if (!user) throw new Error("User not authenticated");
    await updateCategoryService(user.uid, categoryId, category);
    
    // Show success toast
    toast.success("Category updated successfully!", {
      description: `${category.name || 'Category'} - ${category.type || 'Category'}`
    });
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('category_updated', {
    //   id,
    //   ...category
    // });
    // 
    // await addNotification({
    //   type: 'category_updated',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'category'
    // });
  };

  const deleteCategory = async (categoryId: string, transactions: Transaction[]) => {
    if (!user) throw new Error("User not authenticated");
    
    // Check if category is used in any transactions
    const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);
    if (categoryTransactions.length > 0) {
      const category = categories.find(c => c.id === categoryId);
      const categoryName = category?.name || 'Category';
      
      throw new Error(`Cannot delete "${categoryName}" because it is used in ${categoryTransactions.length} transaction(s). Please change the category of these transactions first.`);
    }
    
    await deleteCategoryService(user.uid, categoryId);
    
    // Show success toast
    toast.success("Category deleted successfully!");
    
    // Create notification (disabled)
    // const notificationData = createNotificationMessage('category_deleted', {
    //   id,
    //   name: 'Category',
    //   type: 'Category'
    // });
    // 
    // await addNotification({
    //   type: 'category_deleted',
    //   title: notificationData.title,
    //   message: notificationData.message,
    //   navigationPath: notificationData.navigationPath,
    //   navigationParams: notificationData.navigationParams,
    //   relatedEntityId: id,
    //   relatedEntityType: 'category'
    // });
  };

  const deleteCategoriesBulk = async (categoryIds: string[], transactions: Transaction[]) => {
    if (!user) throw new Error("User not authenticated");
    if (categoryIds.length === 0) return;
    
    // Check if any categories are used in transactions
    const usedCategories: string[] = [];
    const categoryNames: string[] = [];
    
    for (const categoryId of categoryIds) {
      const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);
      if (categoryTransactions.length > 0) {
        usedCategories.push(categoryId);
        const category = categories.find(c => c.id === categoryId);
        categoryNames.push(category?.name || 'Category');
      }
    }
    
    if (usedCategories.length > 0) {
      throw new Error(`Cannot delete categories: ${categoryNames.join(', ')}. These categories are used in transactions. Please change the category of these transactions first.`);
    }
    
    await deleteCategoriesBulkService(user.uid, categoryIds);
    
    // Show success toast
    toast.success(`${categoryIds.length} categories deleted successfully!`);
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, deleteCategoriesBulk, loading }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
