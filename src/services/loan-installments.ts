import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { LoanInstallment } from '@/types';

const getInstallmentsCollection = (userId: string) => collection(db, 'users', userId, 'loanInstallments');

export const addLoanInstallment = async (userId: string, installment: Omit<LoanInstallment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(getInstallmentsCollection(userId), {
      ...installment,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding loan installment:', error);
    throw error;
  }
};

export const updateLoanInstallment = async (userId: string, installmentId: string, updates: Partial<Omit<LoanInstallment, 'id' | 'userId' | 'createdAt'>>) => {
  try {
    const installmentRef = doc(getInstallmentsCollection(userId), installmentId);
    await updateDoc(installmentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating loan installment:', error);
    throw error;
  }
};

export const deleteLoanInstallment = async (userId: string, installmentId: string) => {
  try {
    const installmentRef = doc(getInstallmentsCollection(userId), installmentId);
    await deleteDoc(installmentRef);
  } catch (error) {
    console.error('Error deleting loan installment:', error);
    throw error;
  }
};

export const getLoanInstallments = async (userId: string, loanId?: string) => {
  try {
    let q = query(getInstallmentsCollection(userId), orderBy('dueDate', 'asc'));
    
    if (loanId) {
      q = query(q, where('loanId', '==', loanId));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      paidDate: doc.data().paidDate?.toDate?.()?.toISOString() || doc.data().paidDate,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as LoanInstallment[];
  } catch (error) {
    console.error('Error fetching loan installments:', error);
    throw error;
  }
};

export const payInstallment = async (userId: string, installmentId: string, paidDate?: string) => {
  try {
    const installmentRef = doc(getInstallmentsCollection(userId), installmentId);
    await updateDoc(installmentRef, {
      status: 'paid',
      paidDate: paidDate || new Date().toISOString(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error paying installment:', error);
    throw error;
  }
};

export const generateInstallments = async (userId: string, loanId: string, loan: {
  amount: number;
  installmentCount: number;
  installmentFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  interestRate?: number;
}) => {
  try {
    const installments: Omit<LoanInstallment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [];
    const startDate = new Date(loan.startDate);
    const totalAmount = loan.amount + (loan.interestRate ? (loan.amount * loan.interestRate / 100) : 0);
    const installmentAmount = totalAmount / loan.installmentCount;

    for (let i = 0; i < loan.installmentCount; i++) {
      const dueDate = new Date(startDate);
      
      switch (loan.installmentFrequency) {
        case 'weekly':
          dueDate.setDate(startDate.getDate() + (i * 7));
          break;
        case 'monthly':
          dueDate.setMonth(startDate.getMonth() + i);
          break;
        case 'quarterly':
          dueDate.setMonth(startDate.getMonth() + (i * 3));
          break;
        case 'yearly':
          dueDate.setFullYear(startDate.getFullYear() + i);
          break;
      }

      installments.push({
        loanId,
        amount: installmentAmount,
        dueDate: dueDate.toISOString(),
        status: 'pending',
        installmentNumber: i + 1,
      });
    }

    // Add all installments
    for (const installment of installments) {
      await addLoanInstallment(userId, installment);
    }

    return installments.length;
  } catch (error) {
    console.error('Error generating installments:', error);
    throw error;
  }
};
