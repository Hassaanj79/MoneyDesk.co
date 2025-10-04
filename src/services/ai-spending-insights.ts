import { Transaction } from '@/types';

export interface SpendingInsight {
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

export interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastTransaction?: Date;
  totalSpent: number;
}

export class AISpendingInsightsService {
  private static instance: AISpendingInsightsService;

  private constructor() {}

  public static getInstance(): AISpendingInsightsService {
    if (!AISpendingInsightsService.instance) {
      AISpendingInsightsService.instance = new AISpendingInsightsService();
    }
    return AISpendingInsightsService.instance;
  }

  /**
   * Generate AI-powered spending insights
   */
  public generateInsights(
    transactions: Transaction[],
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    
    // Check if transactions is valid
    if (!transactions || !Array.isArray(transactions)) {
      return insights;
    }
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) {
      return insights;
    }

    // Analyze spending patterns
    const patterns = this.analyzeSpendingPatterns(expenseTransactions);
    
    // Generate insights based on patterns
    insights.push(...this.generatePatternInsights(patterns));
    insights.push(...this.generateBudgetInsights(expenseTransactions, budgets));
    insights.push(...this.generateTrendInsights(expenseTransactions));
    insights.push(...this.generateAnomalyInsights(expenseTransactions));

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze spending patterns by category
   */
  private analyzeSpendingPatterns(transactions: Transaction[]): SpendingPattern[] {
    const categoryMap = new Map<string, Transaction[]>();
    
    // Group transactions by category
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(transaction);
    });

    const patterns: SpendingPattern[] = [];

    categoryMap.forEach((categoryTransactions, category) => {
      const amounts = categoryTransactions.map(t => t.amount);
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const totalSpent = amounts.reduce((sum, amount) => sum + amount, 0);
      
      // Calculate frequency (transactions per week)
      const dates = categoryTransactions.map(t => new Date(t.date)).sort();
      const timeSpan = dates.length > 1 ? 
        (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24 * 7) : 1;
      const frequency = categoryTransactions.length / Math.max(timeSpan, 1);

      // Calculate trend
      const trend = this.calculateTrend(amounts);

      patterns.push({
        category,
        averageAmount,
        frequency,
        trend,
        lastTransaction: dates[dates.length - 1],
        totalSpent
      });
    });

    return patterns;
  }

  /**
   * Calculate spending trend
   */
  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 3) return 'stable';

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate pattern-based insights
   */
  private generatePatternInsights(patterns: SpendingPattern[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // High spending category insight
    const topSpending = patterns.sort((a, b) => b.totalSpent - a.totalSpent)[0];
    if (topSpending && topSpending.totalSpent > 0) {
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `You spend the most on ${topSpending.category} (${this.formatCurrency(topSpending.totalSpent)}). Consider reviewing this category for potential savings.`,
        confidence: 0.9,
        actionable: true,
        actionText: 'Review Category',
        actionUrl: '/transactions'
      });
    }

    // Frequent spending insight
    const frequentSpending = patterns.filter(p => p.frequency > 2).sort((a, b) => b.frequency - a.frequency)[0];
    if (frequentSpending) {
      insights.push({
        type: 'tip',
        title: 'Frequent Spending Alert',
        message: `You make frequent purchases in ${frequentSpending.category} (${frequentSpending.frequency.toFixed(1)} times per week). Consider setting up a budget for this category.`,
        confidence: 0.8,
        actionable: true,
        actionText: 'Set Budget',
        actionUrl: '/budgets'
      });
    }

    // Increasing trend insight
    const increasingTrends = patterns.filter(p => p.trend === 'increasing');
    if (increasingTrends.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Spending Trend Alert',
        message: `Your spending is increasing in ${increasingTrends.length} category(ies). Monitor these trends to stay within budget.`,
        confidence: 0.85,
        actionable: true,
        actionText: 'View Trends',
        actionUrl: '/reports'
      });
    }

    return insights;
  }

  /**
   * Generate budget-based insights
   */
  private generateBudgetInsights(
    transactions: Transaction[],
    budgets?: Array<{category: string, limit: number, spent: number}>
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    if (!budgets || budgets.length === 0) {
      return insights;
    }

    budgets.forEach(budget => {
      const utilization = budget.spent / budget.limit;
      
      if (utilization > 1) {
        insights.push({
          type: 'warning',
          title: 'Budget Exceeded',
          message: `You've exceeded your ${budget.category} budget by ${this.formatCurrency(budget.spent - budget.limit)}.`,
          confidence: 1.0,
          actionable: true,
          actionText: 'Adjust Budget',
          actionUrl: '/budgets'
        });
      } else if (utilization > 0.8) {
        insights.push({
          type: 'info',
          title: 'Budget Warning',
          message: `You're at ${Math.round(utilization * 100)}% of your ${budget.category} budget. Consider reducing spending.`,
          confidence: 0.9,
          actionable: true,
          actionText: 'View Budget',
          actionUrl: '/budgets'
        });
      }
    });

    return insights;
  }

  /**
   * Generate trend-based insights
   */
  private generateTrendInsights(transactions: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Monthly spending trend
    const monthlySpending = this.calculateMonthlySpending(transactions);
    if (monthlySpending.length >= 3) {
      const recent = monthlySpending.slice(-3);
      const trend = this.calculateTrend(recent.map(m => m.total));
      
      if (trend === 'increasing') {
        insights.push({
          type: 'warning',
          title: 'Monthly Spending Increasing',
          message: 'Your monthly spending has been increasing over the last 3 months. Consider reviewing your expenses.',
          confidence: 0.8,
          actionable: true,
          actionText: 'View Trends',
          actionUrl: '/reports'
        });
      } else if (trend === 'decreasing') {
        insights.push({
          type: 'success',
          title: 'Great Job!',
          message: 'Your monthly spending has been decreasing over the last 3 months. Keep up the good work!',
          confidence: 0.9,
          actionable: false
        });
      }
    }

    return insights;
  }

  /**
   * Generate anomaly insights
   */
  private generateAnomalyInsights(transactions: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Large transaction anomaly
    const largeTransactions = transactions.filter(t => t.amount > 1000);
    if (largeTransactions.length > 0) {
      const largest = largeTransactions.sort((a, b) => b.amount - a.amount)[0];
      insights.push({
        type: 'info',
        title: 'Large Transaction',
        message: `You made a large transaction of ${this.formatCurrency(largest.amount)} for ${largest.name}. Make sure this was intentional.`,
        confidence: 0.7,
        actionable: true,
        actionText: 'Review Transaction',
        actionUrl: '/transactions'
      });
    }

    // Unusual spending pattern
    const amounts = transactions.map(t => t.amount);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const standardDeviation = Math.sqrt(
      amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length
    );

    const unusualTransactions = transactions.filter(t => 
      Math.abs(t.amount - average) > 2 * standardDeviation
    );

    if (unusualTransactions.length > 0) {
      insights.push({
        type: 'tip',
        title: 'Unusual Spending Pattern',
        message: `You have ${unusualTransactions.length} transaction(s) that are significantly different from your usual spending pattern.`,
        confidence: 0.6,
        actionable: true,
        actionText: 'Review Transactions',
        actionUrl: '/transactions'
      });
    }

    return insights;
  }

  /**
   * Calculate monthly spending
   */
  private calculateMonthlySpending(transactions: Transaction[]): Array<{month: string, total: number}> {
    const monthlyMap = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, 0);
      }
      monthlyMap.set(monthKey, monthlyMap.get(monthKey)! + transaction.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

// Export singleton instance
export const aiSpendingInsights = AISpendingInsightsService.getInstance();
