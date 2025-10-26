import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { aiCategorization } from '@/services/ai-categorization';
import { aiDuplicateDetection, DuplicateDetectionResult } from '@/services/ai-duplicate-detection';
import { aiSpendingInsights, SpendingInsight } from '@/services/ai-spending-insights';
import { aiNotifications, SmartNotification } from '@/services/ai-notifications';
import { firebaseGemini } from '@/services/firebase-gemini';
import { useCurrency } from '@/hooks/use-currency';
import { useCategories } from '@/contexts/category-context';

export interface AIFeatures {
  // Categorization
  categorizeTransaction: (transaction: Partial<Transaction>) => string | null;
  getCategorizationConfidence: (transaction: Partial<Transaction>) => number;
  suggestCategories: (transaction: Partial<Transaction>) => Array<{category: string, confidence: number}>;
  learnFromUser: (transactionName: string, category: string) => void;

  // Enhanced Gemini-powered features
  getGeminiCategorySuggestions: (transactionName: string, amount: number) => Promise<Array<{category: string, confidence: number, reasoning: string}>>;
  generateGeminiSpendingAnalysis: (transactions: Transaction[]) => Promise<{insights: string[], recommendations: string[], trends: string[], alerts: string[]}>;
  detectGeminiDuplicates: (transaction: Transaction, existingTransactions: Transaction[]) => Promise<{isDuplicate: boolean, confidence: number, reason: string}>;

  // Duplicate Detection
  detectDuplicate: (transaction: Partial<Transaction>, existingTransactions: Transaction[]) => DuplicateDetectionResult;
  findPotentialDuplicates: (transactions: Transaction[]) => Array<{
    transaction: Transaction;
    duplicates: Transaction[];
    confidence: number;
  }>;

  // Spending Insights
  generateSpendingInsights: (transactions: Transaction[], budgets?: Array<{category: string, limit: number, spent: number}>) => SpendingInsight[];

  // Notifications
  generateTransactionNotifications: (transaction: Transaction, existingTransactions: Transaction[], budgets?: Array<{category: string, limit: number, spent: number}>) => SmartNotification[];
  generateDailySummaryNotifications: (transactions: Transaction[], accounts: Array<{name: string, balance: number}>, budgets?: Array<{category: string, limit: number, spent: number}>) => SmartNotification[];
  generateWeeklyInsightsNotifications: (transactions: Transaction[], previousWeekTransactions: Transaction[]) => SmartNotification[];
  getNotifications: () => SmartNotification[];
  getUnreadNotifications: () => SmartNotification[];
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  getNotificationCount: () => number;

  // State
  notifications: SmartNotification[];
  unreadCount: number;
  isLoading: boolean;
  geminiAvailable: boolean;
}

export const useAIFeatures = (): AIFeatures => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();

  // Initialize notifications and check Gemini availability
  useEffect(() => {
    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    setGeminiAvailable(firebaseGemini.isAvailable());
  }, []);

  // Categorization functions
  const categorizeTransaction = useCallback((transaction: Partial<Transaction>): string | null => {
    return aiCategorization.categorizeTransaction(transaction);
  }, []);

  const getCategorizationConfidence = useCallback((transaction: Partial<Transaction>): number => {
    return aiCategorization.getCategorizationConfidence(transaction);
  }, []);

  const suggestCategories = useCallback((transaction: Partial<Transaction>) => {
    return aiCategorization.suggestCategories(transaction);
  }, []);

  const learnFromUser = useCallback((transactionName: string, category: string) => {
    aiCategorization.learnFromUser(transactionName, category);
  }, []);

  // Enhanced Gemini-powered features
  const getGeminiCategorySuggestions = useCallback(async (
    transactionName: string, 
    amount: number
  ): Promise<Array<{category: string, confidence: number, reasoning: string}>> => {
    if (!firebaseGemini.isAvailable()) {
      throw new Error('Firebase Gemini is not available');
    }

    const existingCategoryNames = categories.map(c => c.name);
    return await firebaseGemini.getCategorySuggestions(transactionName, amount, existingCategoryNames);
  }, [categories]);

  const generateGeminiSpendingAnalysis = useCallback(async (
    transactions: Transaction[]
  ): Promise<{insights: string[], recommendations: string[], trends: string[], alerts: string[]}> => {
    if (!firebaseGemini.isAvailable()) {
      throw new Error('Firebase Gemini is not available');
    }

    const transactionData = transactions.map(t => ({
      name: t.name,
      amount: t.amount,
      category: t.categoryName || 'Unknown',
      date: t.date.toISOString().split('T')[0]
    }));

    return await firebaseGemini.generateSpendingAnalysis(transactionData);
  }, []);

  const detectGeminiDuplicates = useCallback(async (
    transaction: Transaction,
    existingTransactions: Transaction[]
  ): Promise<{isDuplicate: boolean, confidence: number, reason: string}> => {
    if (!firebaseGemini.isAvailable()) {
      throw new Error('Firebase Gemini is not available');
    }

    const newTransaction = {
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date.toISOString().split('T')[0]
    };

    const existingData = existingTransactions.map(t => ({
      name: t.name,
      amount: t.amount,
      date: t.date.toISOString().split('T')[0]
    }));

    return await firebaseGemini.detectDuplicates(newTransaction, existingData);
  }, []);

  // Duplicate detection functions
  const detectDuplicate = useCallback((
    transaction: Partial<Transaction>,
    existingTransactions: Transaction[]
  ): DuplicateDetectionResult => {
    return aiDuplicateDetection.detectDuplicate(transaction, existingTransactions);
  }, []);

  const findPotentialDuplicates = useCallback((transactions: Transaction[]) => {
    return aiDuplicateDetection.findPotentialDuplicates(transactions);
  }, []);

  // Spending insights functions
  const generateSpendingInsights = useCallback((
    transactions: Transaction[],
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SpendingInsight[] => {
    return aiSpendingInsights.generateInsights(transactions, budgets);
  }, []);

  // Notification functions
  const generateTransactionNotifications = useCallback((
    transaction: Transaction,
    existingTransactions: Transaction[],
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SmartNotification[] => {
    const newNotifications = aiNotifications.generateTransactionNotifications(
      transaction,
      existingTransactions,
      formatCurrency,
      categories,
      budgets
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, [formatCurrency, categories]);

  const generateDailySummaryNotifications = useCallback((
    transactions: Transaction[],
    accounts: Array<{name: string, balance: number}>,
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SmartNotification[] => {
    const newNotifications = aiNotifications.generateDailySummaryNotifications(
      transactions,
      accounts,
      formatCurrency,
      budgets
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, [formatCurrency]);

  const generateWeeklyInsightsNotifications = useCallback((
    transactions: Transaction[],
    previousWeekTransactions: Transaction[]
  ): SmartNotification[] => {
    const newNotifications = aiNotifications.generateWeeklyInsightsNotifications(
      transactions,
      previousWeekTransactions,
      formatCurrency
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, [formatCurrency]);

  const getNotifications = useCallback((): SmartNotification[] => {
    return aiNotifications.getNotifications();
  }, []);

  const getUnreadNotifications = useCallback((): SmartNotification[] => {
    return aiNotifications.getUnreadNotifications();
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    aiNotifications.markAsRead(notificationId);
    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
  }, []);

  const markAllAsRead = useCallback(() => {
    aiNotifications.markAllAsRead();
    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    aiNotifications.removeNotification(notificationId);
    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
  }, []);

  const getNotificationCount = useCallback((): number => {
    return aiNotifications.getNotificationCount();
  }, []);

  // Cleanup expired notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      aiNotifications.cleanupExpiredNotifications();
      setNotifications(aiNotifications.getNotifications());
      setUnreadCount(aiNotifications.getNotificationCount());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    // Categorization
    categorizeTransaction,
    getCategorizationConfidence,
    suggestCategories,
    learnFromUser,

    // Enhanced Gemini-powered features
    getGeminiCategorySuggestions,
    generateGeminiSpendingAnalysis,
    detectGeminiDuplicates,

    // Duplicate Detection
    detectDuplicate,
    findPotentialDuplicates,

    // Spending Insights
    generateSpendingInsights,

    // Notifications
    generateTransactionNotifications,
    generateDailySummaryNotifications,
    generateWeeklyInsightsNotifications,
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getNotificationCount,

    // State
    notifications,
    unreadCount,
    isLoading,
    geminiAvailable
  };
};
