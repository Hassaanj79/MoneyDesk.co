import { db } from '@/lib/firebase';
import type { Loan } from '@/types';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, getDocs } from 'firebase/firestore';

const getLoansCollection = (userId: string) => collection(db, 'users', userId, 'loans');

export const getLoans = (userId: string) => {
    const loansCol = getLoansCollection(userId);
    return query(loansCol, orderBy('createdAt', 'desc'));
}

export const addLoan = async (userId: string, loan: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const loansCol = getLoansCollection(userId);
    const now = new Date().toISOString();
    return await addDoc(loansCol, {
        ...loan,
        createdAt: now,
        updatedAt: now
    });
};

export const updateLoan = async (userId: string, loanId: string, updates: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt'>>) => {
    const loansCol = getLoansCollection(userId);
    const loanRef = doc(loansCol, loanId);
    await updateDoc(loanRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

export const deleteLoan = async (userId: string, loanId: string) => {
    const loansCol = getLoansCollection(userId);
    const loanRef = doc(loansCol, loanId);
    await deleteDoc(loanRef);
};

export const getLoansByType = async (userId: string, type: 'given' | 'taken') => {
    const loansCol = getLoansCollection(userId);
    const q = query(loansCol, where('type', '==', type), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};

export const getActiveLoans = async (userId: string) => {
    const loansCol = getLoansCollection(userId);
    const q = query(loansCol, where('status', '==', 'active'), orderBy('dueDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};
