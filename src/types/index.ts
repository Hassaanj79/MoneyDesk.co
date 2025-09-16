
export type Transaction = {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  accountId: string;
  isRecurring?: boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

export type Budget = {
  id: string;
  userId: string;
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  categoryId: string;
  startDate: Date;
  endDate: Date;
};

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'cash' | 'credit-card' | 'debit-card' | 'paypal' | 'zelle' | 'cash-app' | 'custom';
  initialBalance: number;
  balance: number; // This will be calculated on the client
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
};

export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  photoURL?: string;
  currency?: string;
};

export type Loan = {
  id: string;
  userId: string;
  type: 'given' | 'taken';
  borrowerName: string;
  borrowerContact?: string;
  amount: number;
  interestRate?: number;
  startDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
  description?: string;
  accountId: string;
  remainingAmount: number;
  totalPaid: number;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
};

    

    