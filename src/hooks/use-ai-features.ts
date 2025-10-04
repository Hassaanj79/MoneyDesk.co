import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { aiCategorization } from '@/services/ai-categorization';
import { aiDuplicateDetection, DuplicateDetectionResult } from '@/services/ai-duplicate-detection';
import { aiSpendingInsights, SpendingInsight } from '@/services/ai-spending-insights';
import { aiNotifications, SmartNotification } from '@/services/ai-notifications';

export interface AIFeatures {
  // Categorization
  categorizeTransaction: (transaction: Partial<Transaction>) => string | null;
  getCategorizationConfidence: (transaction: Partial<Transaction>) => number;
  suggestCategories: (transaction: Partial<Transaction>) => Array<{category: string, confidence: number}>;
  learnFromUser: (transactionName: string, category: string) => void;

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
}

export const useAIFeatures = (): AIFeatures => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize notifications
  useEffect(() => {
    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
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
      budgets
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, []);

  const generateDailySummaryNotifications = useCallback((
    transactions: Transaction[],
    accounts: Array<{name: string, balance: number}>,
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SmartNotification[] => {
    const newNotifications = aiNotifications.generateDailySummaryNotifications(
      transactions,
      accounts,
      budgets
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, []);

  const generateWeeklyInsightsNotifications = useCallback((
    transactions: Transaction[],
    previousWeekTransactions: Transaction[]
  ): SmartNotification[] => {
    const newNotifications = aiNotifications.generateWeeklyInsightsNotifications(
      transactions,
      previousWeekTransactions
    );
    
    newNotifications.forEach(notification => {
      aiNotifications.addNotification(notification);
    });

    setNotifications(aiNotifications.getNotifications());
    setUnreadCount(aiNotifications.getNotificationCount());
    
    return newNotifications;
  }, []);

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
    isLoading
  };
};
