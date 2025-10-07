"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/contexts/transaction-context";
import { useCategories } from "@/contexts/category-context";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { ArrowUpRight, ArrowDownLeft, Calendar, Tag, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatAmount } from "@/utils/format-amount";
import type { Account, Transaction } from "@/types";
import { format, parseISO } from "date-fns";

interface AccountBreakdownProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountBreakdown({ account, isOpen, onClose }: AccountBreakdownProps) {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency, currency } = useCurrency();
  const { accounts } = useAccounts();

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
  
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  const [breakdown, setBreakdown] = useState({
    initialBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    currentBalance: 0,
    transactionCount: 0
  });

  useEffect(() => {
    if (account && transactions.length > 0) {
      // Filter transactions for this account
      const accountTxns = transactions.filter(t => t.accountId === account.id);
      setAccountTransactions(accountTxns);

      // Calculate breakdown
      const initialBalance = account.initialBalance || 0;
      const totalIncome = accountTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = accountTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = initialBalance + totalIncome - totalExpenses;

      setBreakdown({
        initialBalance,
        totalIncome,
        totalExpenses,
        currentBalance,
        transactionCount: accountTxns.length
      });
    }
  }, [account, transactions]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.type === 'income' ? TrendingUp : TrendingDown;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const sortedTransactions = [...accountTransactions].sort((a, b) => 
    getDate(b.date).getTime() - getDate(a.date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden mx-2 sm:mx-4">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">{account.name} - Balance Breakdown</span>
              <span className="sm:hidden">Balance Breakdown</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            <span className="hidden sm:inline">Comprehensive analysis of your account balance with detailed transaction history</span>
            <span className="sm:hidden">Account balance analysis</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow min-w-0">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-1.5 rounded-full bg-blue-100">
                    <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                  </div>
                  <span className="hidden sm:inline">Initial Balance</span>
                  <span className="sm:hidden">Initial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-gray-900 break-words" title={formatCurrency(breakdown.initialBalance)}>
                  {formatCurrency(breakdown.initialBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Starting amount</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow min-w-0">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-1.5 rounded-full bg-green-100">
                    <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                  </div>
                  <span className="hidden sm:inline">Total Income</span>
                  <span className="sm:hidden">Income</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-green-600 break-words" title={`+${formatCurrency(breakdown.totalIncome)}`}>
                  +{formatCurrency(breakdown.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Money received</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow min-w-0">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-red-700 flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-1.5 rounded-full bg-red-100">
                    <ArrowDownLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                  </div>
                  <span className="hidden sm:inline">Total Expenses</span>
                  <span className="sm:hidden">Expenses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-red-600 break-words" title={formatCurrency(breakdown.totalExpenses)}>
                  {formatCurrency(breakdown.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Money spent</p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 hover:shadow-lg transition-shadow min-w-0 ${
              breakdown.currentBalance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'
            }`}>
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className={`text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 ${
                  breakdown.currentBalance >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  <div className={`p-1 sm:p-1.5 rounded-full ${
                    breakdown.currentBalance >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <DollarSign className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                      breakdown.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`} />
                  </div>
                  <span className="hidden sm:inline">Current Balance</span>
                  <span className="sm:hidden">Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold break-words ${
                  breakdown.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`} title={formatAmount(breakdown.currentBalance, currency)}>
                  {formatAmount(breakdown.currentBalance, currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {breakdown.currentBalance >= 0 ? 'Available funds' : 'Overdrawn'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Formula */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <span className="hidden sm:inline">Balance Calculation</span>
                <span className="sm:hidden">Calculation</span>
              </CardTitle>
              <CardDescription className="text-sm">
                <span className="hidden sm:inline">Step-by-step breakdown of how the current balance was calculated</span>
                <span className="sm:hidden">Balance calculation steps</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="bg-white p-3 sm:p-6 rounded-lg border shadow-sm">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between py-2 px-2 sm:px-3 bg-gray-50 rounded-md">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Initial Balance</span>
                    <span className="text-xs font-mono font-semibold break-words text-right flex-1 ml-2" title={formatAmount(breakdown.initialBalance, currency)}>{formatAmount(breakdown.initialBalance, currency)}</span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-lg sm:text-2xl text-gray-400">+</div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-2 sm:px-3 bg-green-50 rounded-md border border-green-200">
                    <span className="text-xs sm:text-sm font-medium text-green-700">Total Income</span>
                    <span className="text-xs font-mono font-semibold text-green-600 break-words text-right flex-1 ml-2" title={`+${formatAmount(breakdown.totalIncome, currency)}`}>+{formatAmount(breakdown.totalIncome, currency)}</span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-lg sm:text-2xl text-gray-400">-</div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-2 sm:px-3 bg-red-50 rounded-md border border-red-200">
                    <span className="text-xs sm:text-sm font-medium text-red-700">Total Expenses</span>
                    <span className="text-xs font-mono font-semibold text-red-600 break-words text-right flex-1 ml-2" title={formatAmount(breakdown.totalExpenses, currency)}>{formatAmount(breakdown.totalExpenses, currency)}</span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-lg sm:text-2xl text-gray-400">=</div>
                  </div>
                  
                  <div className={`flex items-center justify-between py-2 sm:py-3 px-2 sm:px-4 rounded-md border-2 font-bold ${
                    breakdown.currentBalance >= 0 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <span className={`text-xs sm:text-sm ${
                      breakdown.currentBalance >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      Current Balance
                    </span>
                    <span className={`text-xs sm:text-sm font-mono break-words text-right flex-1 ml-2 ${
                      breakdown.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`} title={formatAmount(breakdown.currentBalance, currency)}>
                      {formatAmount(breakdown.currentBalance, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <span className="hidden sm:inline">Transaction History</span>
                <span className="sm:hidden">Transactions</span>
              </CardTitle>
              <CardDescription className="text-sm">
                All transactions for this account ({breakdown.transactionCount} total)
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {sortedTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <div className="p-3 sm:p-4 rounded-full bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                  </div>
                  <p className="text-base sm:text-lg font-medium mb-2">No transactions found</p>
                  <p className="text-xs sm:text-sm">This account doesn't have any transactions yet</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2 max-h-96 overflow-y-auto">
                  {sortedTransactions.map((transaction) => {
                    const CategoryIcon = getCategoryIcon(transaction.categoryId);
                    const categoryName = getCategoryName(transaction.categoryId);
                    const categoryColor = getCategoryColor(transaction.categoryId);
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 sm:p-4 border rounded-lg sm:rounded-xl hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-3 w-3 sm:h-5 sm:w-5" />
                            ) : (
                              <ArrowDownLeft className="h-3 w-3 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{transaction.name}</div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">{format(getDate(transaction.date), 'MMM dd, yyyy')}</span>
                                <span className="sm:hidden">{format(getDate(transaction.date), 'MMM dd')}</span>
                              </div>
                              <div className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></div>
                              <div className="flex items-center gap-1">
                                <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className={`${categoryColor} truncate`}>{categoryName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-0 flex-shrink-0 ml-2">
                          <div className={`text-xs sm:text-sm font-bold break-words ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`} title={`${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 hidden sm:block ${
                              transaction.type === 'income' 
                                ? 'border-green-200 text-green-700 bg-green-50' 
                                : 'border-red-200 text-red-700 bg-red-50'
                            }`}
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
