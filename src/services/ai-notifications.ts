import { Transaction } from '@/types';

export interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: 'spending' | 'budget' | 'saving' | 'transaction' | 'account';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
  autoExpire?: Date;
}

export class AINotificationService {
  private static instance: AINotificationService;
  private notifications: Map<string, SmartNotification> = new Map();

  private constructor() {}

  public static getInstance(): AINotificationService {
    if (!AINotificationService.instance) {
      AINotificationService.instance = new AINotificationService();
    }
    return AINotificationService.instance;
  }

  /**
   * Generate smart notifications based on transaction activity
   */
  public generateTransactionNotifications(
    newTransaction: Transaction,
    existingTransactions: Transaction[],
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    
    // Check if existingTransactions is valid
    if (!existingTransactions || !Array.isArray(existingTransactions)) {
      return notifications;
    }

    // Large transaction notification
    if (newTransaction.amount > 500) {
      notifications.push({
        id: `large-transaction-${Date.now()}`,
        type: 'info',
        title: 'Large Transaction',
        message: `You made a large transaction of $${newTransaction.amount.toFixed(2)} for ${newTransaction.name}.`,
        priority: 'medium',
        category: 'transaction',
        actionable: true,
        actionText: 'View Transaction',
        actionUrl: '/transactions',
        timestamp: new Date(),
        read: false
      });
    }

    // Budget warning notification
    if (budgets) {
      const budget = budgets.find(b => b.category === newTransaction.category);
      if (budget) {
        const newSpent = budget.spent + newTransaction.amount;
        const utilization = newSpent / budget.limit;

        if (utilization > 1) {
          notifications.push({
            id: `budget-exceeded-${Date.now()}`,
            type: 'warning',
            title: 'Budget Exceeded',
            message: `You've exceeded your ${budget.category} budget by $${(newSpent - budget.limit).toFixed(2)}.`,
            priority: 'high',
            category: 'budget',
            actionable: true,
            actionText: 'View Budget',
            actionUrl: '/budgets',
            timestamp: new Date(),
            read: false
          });
        } else if (utilization > 0.8) {
          notifications.push({
            id: `budget-warning-${Date.now()}`,
            type: 'warning',
            title: 'Budget Warning',
            message: `You're at ${Math.round(utilization * 100)}% of your ${budget.category} budget.`,
            priority: 'medium',
            category: 'budget',
            actionable: true,
            actionText: 'View Budget',
            actionUrl: '/budgets',
            timestamp: new Date(),
            read: false
          });
        }
      }
    }

    // Spending pattern notification
    const recentTransactions = existingTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    const categorySpending = recentTransactions
      .filter(t => t.category === newTransaction.category)
      .reduce((sum, t) => sum + t.amount, 0);

    if (categorySpending > 200) {
      notifications.push({
        id: `spending-pattern-${Date.now()}`,
        type: 'info',
        title: 'Spending Pattern Alert',
        message: `You've spent $${categorySpending.toFixed(2)} on ${newTransaction.category} this week.`,
        priority: 'low',
        category: 'spending',
        actionable: true,
        actionText: 'View Category',
        actionUrl: '/transactions',
        timestamp: new Date(),
        read: false
      });
    }

    return notifications;
  }

  /**
   * Generate daily summary notifications
   */
  public generateDailySummaryNotifications(
    transactions: Transaction[],
    accounts: Array<{name: string, balance: number}>,
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    
    // Check if transactions is valid
    if (!transactions || !Array.isArray(transactions)) {
      return notifications;
    }
    
    const today = new Date();
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.toDateString() === today.toDateString();
    });

    // Daily spending summary
    const totalSpent = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalSpent > 0) {
      notifications.push({
        id: `daily-summary-${Date.now()}`,
        type: 'info',
        title: 'Daily Spending Summary',
        message: `You spent $${totalSpent.toFixed(2)} today across ${todayTransactions.length} transaction(s).`,
        priority: 'low',
        category: 'spending',
        actionable: true,
        actionText: 'View Transactions',
        actionUrl: '/transactions',
        timestamp: new Date(),
        read: false,
        autoExpire: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Expire in 24 hours
      });
    }

    // Low balance warning
    const lowBalanceAccounts = accounts.filter(a => a.balance < 100);
    if (lowBalanceAccounts.length > 0) {
      notifications.push({
        id: `low-balance-${Date.now()}`,
        type: 'warning',
        title: 'Low Account Balance',
        message: `${lowBalanceAccounts.length} account(s) have low balances. Consider transferring funds.`,
        priority: 'high',
        category: 'account',
        actionable: true,
        actionText: 'View Accounts',
        actionUrl: '/accounts',
        timestamp: new Date(),
        read: false
      });
    }

    // Budget progress notification
    if (budgets) {
      const nearLimitBudgets = budgets.filter(b => {
        const utilization = b.spent / b.limit;
        return utilization > 0.7 && utilization < 1;
      });

      if (nearLimitBudgets.length > 0) {
        notifications.push({
          id: `budget-progress-${Date.now()}`,
          type: 'info',
          title: 'Budget Progress Update',
          message: `${nearLimitBudgets.length} budget(s) are over 70% utilized.`,
          priority: 'medium',
          category: 'budget',
          actionable: true,
          actionText: 'View Budgets',
          actionUrl: '/budgets',
          timestamp: new Date(),
          read: false
        });
      }
    }

    return notifications;
  }

  /**
   * Generate weekly insights notifications
   */
  public generateWeeklyInsightsNotifications(
    transactions: Transaction[],
    previousWeekTransactions: Transaction[]
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    
    // Check if transactions are valid
    if (!transactions || !Array.isArray(transactions) || 
        !previousWeekTransactions || !Array.isArray(previousWeekTransactions)) {
      return notifications;
    }

    const currentWeekSpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousWeekSpending = previousWeekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const spendingChange = currentWeekSpending - previousWeekSpending;
    const changePercentage = previousWeekSpending > 0 ? 
      (spendingChange / previousWeekSpending) * 100 : 0;

    if (Math.abs(changePercentage) > 20) {
      const isIncrease = changePercentage > 0;
      notifications.push({
        id: `weekly-insight-${Date.now()}`,
        type: isIncrease ? 'warning' : 'success',
        title: 'Weekly Spending Insight',
        message: `Your spending this week is ${Math.abs(changePercentage).toFixed(1)}% ${isIncrease ? 'higher' : 'lower'} than last week.`,
        priority: 'medium',
        category: 'spending',
        actionable: true,
        actionText: 'View Reports',
        actionUrl: '/reports',
        timestamp: new Date(),
        read: false
      });
    }

    return notifications;
  }

  /**
   * Add a notification
   */
  public addNotification(notification: SmartNotification): void {
    this.notifications.set(notification.id, notification);
  }

  /**
   * Get all notifications
   */
  public getNotifications(): SmartNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): SmartNotification[] {
    return this.getNotifications().filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
  }

  /**
   * Remove notification
   */
  public removeNotification(notificationId: string): void {
    this.notifications.delete(notificationId);
  }

  /**
   * Clean up expired notifications
   */
  public cleanupExpiredNotifications(): void {
    const now = new Date();
    this.notifications.forEach((notification, id) => {
      if (notification.autoExpire && notification.autoExpire < now) {
        this.notifications.delete(id);
      }
    });
  }

  /**
   * Get notification count
   */
  public getNotificationCount(): number {
    return this.getUnreadNotifications().length;
  }
}

// Export singleton instance
export const aiNotifications = AINotificationService.getInstance();
