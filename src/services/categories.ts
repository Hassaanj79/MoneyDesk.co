import { db } from '@/lib/firebase';
import type { Category } from '@/types';
import { collection, addDoc, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const getCategoriesCollection = (userId: string) => collection(db, 'users', userId, 'categories');

export const getCategories = (userId: string) => {
    const categoriesCol = getCategoriesCollection(userId);
    return query(categoriesCol);
}

export const addCategory = async (userId: string, category: Omit<Category, 'id' | 'userId'>) => {
    const categoriesCol = getCategoriesCollection(userId);
    const result = await addDoc(categoriesCol, category);
    return result;
};

export const updateCategory = async (userId: string, categoryId: string, category: Partial<Omit<Category, 'id' | 'userId'>>) => {
    const categoryDoc = doc(db, 'users', userId, 'categories', categoryId);
    return await updateDoc(categoryDoc, category);
};

export const deleteCategory = async (userId: string, categoryId: string) => {
    const categoryDoc = doc(db, 'users', userId, 'categories', categoryId);
    return await deleteDoc(categoryDoc);
};
