import type { Budget, Transaction } from '@/types';

/**
 * Calculate budget progress based on actual expenses
 * @param budget - The budget to calculate progress for
 * @param transactions - All transactions to filter from
 * @returns Object with progress percentage, spent amount, and remaining amount
 */
export function calculateBudgetProgress(budget: Budget, transactions: Transaction[]) {
  const budgetStartDate = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate);
  const budgetEndDate = budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate);
  
  // Filter expenses for this budget's category within the budget period
  const relevantExpenses = transactions.filter(transaction => 
    transaction.type === 'expense' &&
    transaction.categoryId === budget.categoryId &&
    new Date(transaction.date) >= budgetStartDate &&
    new Date(transaction.date) <= budgetEndDate
  );
  
  // Calculate total spent
  const spent = relevantExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  // Calculate progress percentage
  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = Math.max(0, budget.amount - spent);
  const isOverBudget = progress > 100;
  
  
  return {
    progress: progress, // Don't cap at 100% - show actual progress even when over budget
    spent,
    remaining,
    isOverBudget,
    relevantExpensesCount: relevantExpenses.length
  };
}

/**
 * Get budget status based on progress
 * @param progress - Progress percentage (can be over 100%)
 * @returns Status string and color classes
 */
export function getBudgetStatus(progress: number) {
  if (progress >= 100) {
    return { 
      status: 'Over Budget', 
      color: 'text-red-600',
      progressBarColor: 'bg-red-500',
      progressBarBgColor: 'bg-gray-200'
    };
  } else {
    return { 
      status: progress >= 80 ? 'Near Limit' : progress >= 50 ? 'Half Used' : 'On Track',
      color: 'text-purple-600',
      progressBarColor: 'bg-purple-600',
      progressBarBgColor: 'bg-gray-200'
    };
  }
}
