
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
  categoryId: string;
  limit: number;
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
  name:string;
  type: 'income' | 'expense';
};

export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  street?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  photoURL?: string;
  currency?: string;
};

    

    