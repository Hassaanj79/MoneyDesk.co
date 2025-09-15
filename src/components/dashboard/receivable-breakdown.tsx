"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoans } from "@/contexts/loan-context";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { HandCoins, AlertTriangle, CheckCircle, Calendar, User } from "lucide-react";
import { format, isBefore } from "date-fns";

interface ReceivableBreakdownProps {
  onClose: () => void;
}

export function ReceivableBreakdown({ onClose }: ReceivableBreakdownProps) {
  const { loans } = useLoans();
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();

  const receivableBreakdown = useMemo(() => {
    const now = new Date();
    
    // Get all given loans (money others owe you)
    const givenLoans = loans.filter(loan => loan.type === 'given');
    const activeGivenLoans = givenLoans.filter(loan => loan.status === 'active');
    const overdueGivenLoans = activeGivenLoans.filter(loan => isBefore(new Date(loan.dueDate), now));
    const completedGivenLoans = givenLoans.filter(loan => loan.status === 'completed');
    
    const totalReceivable = activeGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const overdueAmount = overdueGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalPaid = activeGivenLoans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const totalCompleted = completedGivenLoans.reduce((sum, loan) => sum + loan.amount, 0);
    
    // Group by account
    const byAccount = activeGivenLoans.reduce((acc, loan) => {
      const account = accounts.find(acc => acc.id === loan.accountId);
      const accountName = account?.name || 'Unknown Account';
      if (!acc[accountName]) {
        acc[accountName] = { amount: 0, count: 0, overdue: 0 };
      }
      acc[accountName].amount += loan.remainingAmount;
      acc[accountName].count += 1;
      if (isBefore(new Date(loan.dueDate), now)) {
        acc[accountName].overdue += loan.remainingAmount;
      }
      return acc;
    }, {} as Record<string, { amount: number; count: number; overdue: number }>);

    return {
      totalReceivable,
      overdueAmount,
      totalPaid,
      totalCompleted,
      activeCount: activeGivenLoans.length,
      overdueCount: overdueGivenLoans.length,
      completedCount: completedGivenLoans.length,
      byAccount,
      activeLoans: activeGivenLoans,
      overdueLoans: overdueGivenLoans,
    };
  }, [loans, accounts]);

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Unknown Account';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <HandCoins className="h-6 w-6 text-green-600" />
          Accounts Receivable Breakdown
        </h2>
        <p className="text-muted-foreground mt-2">
          Money others owe you from given loans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receivable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receivableBreakdown.totalReceivable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(receivableBreakdown.overdueAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(receivableBreakdown.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {formatCurrency(receivableBreakdown.totalCompleted)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Account */}
      {Object.keys(receivableBreakdown.byAccount).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(receivableBreakdown.byAccount).map(([accountName, data]) => (
                <div key={accountName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{accountName}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} loan{data.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(data.amount)}
                    </div>
                    {data.overdue > 0 && (
                      <div className="text-sm text-red-600">
                        {formatCurrency(data.overdue)} overdue
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Loans List */}
      {receivableBreakdown.activeLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              Active Loans ({receivableBreakdown.activeCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivableBreakdown.activeLoans.map((loan) => {
                const isOverdue = isBefore(new Date(loan.dueDate), new Date());
                return (
                  <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{loan.borrowerName}</span>
                      </div>
                      <Badge variant={isOverdue ? "destructive" : "default"} className="flex items-center gap-1">
                        {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {isOverdue ? 'Overdue' : 'Active'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(loan.remainingAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Loans Alert */}
      {receivableBreakdown.overdueLoans.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue Loans ({receivableBreakdown.overdueCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivableBreakdown.overdueLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{loan.borrowerName}</span>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(loan.remainingAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No loans message */}
      {receivableBreakdown.activeLoans.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Receivables</h3>
            <p className="text-muted-foreground">
              You don't have any active loans given out at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
