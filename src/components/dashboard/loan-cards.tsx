"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoans } from "@/contexts/loan-context";
import { useCurrency } from "@/hooks/use-currency";
import { HandCoins, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";

export function LoanCards() {
  const { loans } = useLoans();
  const { formatCurrency } = useCurrency();

  const loanStats = useMemo(() => {
    const now = new Date();
    
    const givenLoans = loans.filter(loan => loan.type === 'given');
    const takenLoans = loans.filter(loan => loan.type === 'taken');
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const overdueLoans = activeLoans.filter(loan => isAfter(now, new Date(loan.dueDate)));

    const totalGiven = givenLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalTaken = takenLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalRemainingGiven = givenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalRemainingTaken = takenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

    return {
      totalGiven,
      totalTaken,
      totalRemainingGiven,
      totalRemainingTaken,
      activeCount: activeLoans.length,
      overdueCount: overdueLoans.length,
    };
  }, [loans]);

  const getStatusColor = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'partially_paid') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (isAfter(now, due)) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (status === 'completed') return <CheckCircle className="h-4 w-4" />;
    if (status === 'partially_paid') return <CreditCard className="h-4 w-4" />;
    if (isAfter(now, due)) return <AlertTriangle className="h-4 w-4" />;
    return <HandCoins className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loans Given</CardTitle>
            <HandCoins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(loanStats.totalGiven)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(loanStats.totalRemainingGiven)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loans Taken</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(loanStats.totalTaken)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(loanStats.totalRemainingTaken)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
            <HandCoins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loanStats.activeCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {loanStats.overdueCount} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Position</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              loanStats.totalRemainingGiven > loanStats.totalRemainingTaken 
                ? 'text-green-600' 
                : loanStats.totalRemainingTaken > loanStats.totalRemainingGiven 
                ? 'text-red-600' 
                : 'text-gray-600'
            }`}>
              {formatCurrency(loanStats.totalRemainingGiven - loanStats.totalRemainingTaken)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loanStats.totalRemainingGiven > loanStats.totalRemainingTaken ? 'Net lender' : 'Net borrower'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Loans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loans found. Create your first loan to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {loans.slice(0, 5).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      loan.type === 'given' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    }`}>
                      {loan.type === 'given' ? (
                        <HandCoins className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{loan.borrowerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {loan.type === 'given' ? 'Given to' : 'Taken from'} • {format(new Date(loan.startDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(loan.status, loan.dueDate)}
                      >
                        {getStatusIcon(loan.status, loan.dueDate)}
                        <span className="ml-1">
                          {loan.status === 'completed' ? 'Completed' : 
                           loan.status === 'partially_paid' ? 'Partially Paid' :
                           isAfter(new Date(), new Date(loan.dueDate)) ? 'Overdue' : 'Active'}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
