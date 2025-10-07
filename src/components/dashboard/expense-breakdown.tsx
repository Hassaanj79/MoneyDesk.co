"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useDateRange } from "@/contexts/date-range-context";
import { useCategories } from "@/contexts/category-context";
import { ArrowUp, TrendingDown, CreditCard } from "lucide-react";
import { isWithinInterval, parseISO } from "date-fns";
import { formatAmount } from "@/utils/format-amount";

interface ExpenseBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpenseBreakdown = ({ open, onOpenChange }: ExpenseBreakdownProps) => {
  const { formatCurrency, currency } = useCurrency();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { date } = useDateRange();
  const { categories } = useCategories();

  // Helper function to safely convert date to Date object
  const getDate = (dateValue: any): Date => {
    if (typeof dateValue === 'string') {
      return parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore timestamp
      return dateValue.toDate();
    } else if (dateValue && typeof dateValue.toISOString === 'function') {
      return new Date(dateValue.toISOString());
    }
    return new Date(); // fallback
  };

  const expenseBreakdown = useMemo(() => {
    const currentPeriodTransactions = transactions.filter(t => 
      date?.from && date?.to ? isWithinInterval(getDate(t.date), { start: date.from, end: date.to }) : true
    );

    const expenseTransactions = currentPeriodTransactions.filter(t => t.type === 'expense');
    
    // Group by category
    const categoryBreakdown = expenseTransactions.reduce((acc, transaction) => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Unknown';
      
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          amount: 0,
          count: 0,
          transactions: []
        };
      }
      
      acc[categoryName].amount += transaction.amount;
      acc[categoryName].count += 1;
      acc[categoryName].transactions.push(transaction);
      
      return acc;
    }, {} as Record<string, { name: string; amount: number; count: number; transactions: any[] }>);

    // Group by account
    const accountBreakdown = expenseTransactions.reduce((acc, transaction) => {
      const account = accounts.find(a => a.id === transaction.accountId);
      const accountName = account?.name || 'Unknown Account';
      
      if (!acc[accountName]) {
        acc[accountName] = {
          name: accountName,
          amount: 0,
          count: 0,
          accountType: account?.type || 'unknown'
        };
      }
      
      acc[accountName].amount += transaction.amount;
      acc[accountName].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; amount: number; count: number; accountType: string }>);

    return {
      totalExpense: expenseTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalTransactions: expenseTransactions.length,
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
      accountBreakdown: Object.values(accountBreakdown).sort((a, b) => b.amount - a.amount)
    };
  }, [transactions, date, accounts, categories]);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <CreditCard className="h-4 w-4" />;
      case 'credit-card': return <TrendingDown className="h-4 w-4" />;
      case 'debit-card': return <TrendingDown className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'bank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cash': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'credit-card': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'debit-card': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            Expense Breakdown
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground !text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatAmount(expenseBreakdown.totalExpense, currency)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground !text-muted-foreground">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                  {expenseBreakdown.totalTransactions}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Expenses by Category</h3>
            {expenseBreakdown.categoryBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No expense transactions found for the selected period.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.categoryBreakdown.map((category) => (
                  <Card key={category.name} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {category.count} transaction{category.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatAmount(category.amount, currency)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Account Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Expenses by Account</h3>
            {expenseBreakdown.accountBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No expense transactions found for the selected period.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.accountBreakdown.map((account) => (
                  <Card key={account.name} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getAccountTypeIcon(account.accountType)}
                          <div>
                            <h4 className="font-semibold">{account.name}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getAccountTypeColor(account.accountType)}`}
                            >
                              {account.accountType.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatAmount(account.amount, currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {account.count} transaction{account.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseBreakdown;
