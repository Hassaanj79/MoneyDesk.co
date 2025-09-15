
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Category } from '@/types';
import { useAuth } from './auth-context';
import { addCategory as addCategoryService, getCategories } from '@/services/categories';
import { onSnapshot } from 'firebase/firestore';

interface CategoryContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<string | undefined>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const defaultCategories: Omit<Category, 'id'|'userId'>[] = [
    { name: "Food", type: "expense" },
    { name: "Shopping", type: "expense" },
    { name: "Transport", type: "expense" },
    { name: "Entertainment", type: "expense" },
    { name: "Salary", type: "income" },
    { name: "Freelance", type: "income" },
    { name: 'Groceries', type: 'expense' },
    { name: 'Utilities', type: 'expense' },
    { name: 'Housing', type: 'expense' },
    { name: 'Health', type: 'expense' },
    { name: 'Investment', type: 'income' },
    { name: 'Gifts', type: 'expense' },
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
    if (!user) throw new Error("User not authenticated");
    const newDoc = await addCategoryService(user.uid, category);
    return newDoc?.id;
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, loading }}>
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
