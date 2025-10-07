"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { Wallet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatAmount } from "@/utils/format-amount";

interface BalanceBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BalanceBreakdown = ({ open, onOpenChange }: BalanceBreakdownProps) => {
  const { formatCurrency, currency } = useCurrency();
  const { accounts, refreshTrigger: accountRefreshTrigger } = useAccounts();
  const { transactions, refreshTrigger } = useTransactions();

  // Use the professional formatter from utils
  const formatAmountWithCurrency = (value: number) => formatAmount(value, currency);

  const accountBreakdown = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Use the stored balance from the database instead of calculating it
      const currentBalance = account.balance || 0;
      const netChange = income - expenses;
      
      return {
        ...account,
        currentBalance,
        income,
        expenses,
        netChange,
        transactionCount: accountTransactions.length
      };
    }).sort((a, b) => b.currentBalance - a.currentBalance);
  }, [accounts, transactions, refreshTrigger, accountRefreshTrigger]);

  const totalBalance = accountBreakdown.reduce((sum, account) => sum + account.currentBalance, 0);
  const totalIncome = accountBreakdown.reduce((sum, account) => sum + account.income, 0);
  const totalExpenses = accountBreakdown.reduce((sum, account) => sum + account.expenses, 0);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Wallet className="h-4 w-4" />;
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'credit-card': return <TrendingUp className="h-4 w-4" />;
      case 'debit-card': return <TrendingDown className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
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
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            Balance Breakdown
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmountWithCurrency(totalBalance)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmountWithCurrency(totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatAmountWithCurrency(totalExpenses)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Account Details</h3>
            {accountBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
                  <div className="text-sm sm:text-base">
                    No accounts found. Add an account to see balance breakdown.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {accountBreakdown.map((account) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {getAccountTypeIcon(account.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold truncate text-sm sm:text-base">{account.name}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getAccountTypeColor(account.type)}`}
                            >
                              {account.type.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right min-w-0 flex-shrink-0">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatAmountWithCurrency(account.currentBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {account.transactionCount} transactions
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-muted-foreground text-xs mb-1">Initial</div>
                          <div className="font-semibold">{formatAmountWithCurrency(account.initialBalance)}</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-muted-foreground text-xs mb-1">Income</div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            +{formatAmountWithCurrency(account.income)}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-muted-foreground text-xs mb-1">Expenses</div>
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            -{formatAmountWithCurrency(account.expenses)}
                          </div>
                        </div>
                      </div>
                      
                      {account.netChange !== 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-center gap-2 text-sm">
                            {account.netChange > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : account.netChange < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="text-muted-foreground">Net Change:</span>
                            <span className={`font-semibold ${
                              account.netChange > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : account.netChange < 0 
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600'
                            }`}>
                              {account.netChange > 0 ? '+' : ''}{formatAmountWithCurrency(account.netChange)}
                            </span>
                          </div>
                        </div>
                      )}
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

export default BalanceBreakdown;
