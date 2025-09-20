"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { Wallet, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BalanceBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BalanceBreakdown = ({ open, onOpenChange }: BalanceBreakdownProps) => {
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const accountBreakdown = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentBalance = account.initialBalance + income - expenses;
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
  }, [accounts, transactions]);

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground !text-muted-foreground">Total Balance</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                  {formatCurrency(totalBalance)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground !text-muted-foreground">Total Income</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400 break-words">
                  {formatCurrency(totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground !text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400 break-words">
                  {formatCurrency(totalExpenses)}
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
                          <div className="text-sm sm:text-base lg:text-lg font-bold break-words">
                            {formatCurrency(account.currentBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {account.transactionCount} transactions
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="min-w-0">
                          <div className="text-muted-foreground">Initial</div>
                          <div className="font-medium break-words">{formatCurrency(account.initialBalance)}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-muted-foreground">Income</div>
                          <div className="font-medium text-green-600 dark:text-green-400 break-words">
                            +{formatCurrency(account.income)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-muted-foreground">Expenses</div>
                          <div className="font-medium text-red-600 dark:text-red-400 break-words">
                            -{formatCurrency(account.expenses)}
                          </div>
                        </div>
                      </div>
                      
                      {account.netChange !== 0 && (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0">
                            {account.netChange > 0 ? (
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                            ) : account.netChange < 0 ? (
                              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                            ) : (
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                            )}
                            <span className="text-muted-foreground flex-shrink-0">Net Change:</span>
                            <span className={`font-medium break-words ${
                              account.netChange > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : account.netChange < 0 
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600'
                            }`}>
                              {account.netChange > 0 ? '+' : ''}{formatCurrency(account.netChange)}
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
