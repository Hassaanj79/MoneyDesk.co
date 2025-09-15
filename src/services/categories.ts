import { db } from '@/lib/firebase';
import type { Category } from '@/types';
import { collection, addDoc, query } from 'firebase/firestore';

const getCategoriesCollection = (userId: string) => collection(db, 'users', userId, 'categories');

export const getCategories = (userId: string) => {
    const categoriesCol = getCategoriesCollection(userId);
    return query(categoriesCol);
}

export const addCategory = async (userId: string, category: Omit<Category, 'id' | 'userId'>) => {
    const categoriesCol = getCategoriesCollection(userId);
    return await addDoc(categoriesCol, category);
};
