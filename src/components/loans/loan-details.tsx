"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { getLoanCalculation } from "@/lib/loan-calculations";
import { LoanInstallments } from "./loan-installments";
import { LoanPayment } from "./loan-payment";
import { LoanRepayment } from "./loan-repayment";
import type { Loan } from "@/types";
import { HandCoins, Calendar, User, DollarSign, CreditCard, AlertTriangle, CheckCircle, Calculator } from "lucide-react";

interface LoanDetailsProps {
  loan: Loan;
  children?: React.ReactNode;
}

export function LoanDetails({ loan, children }: LoanDetailsProps) {
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();

  const account = accounts.find(acc => acc.id === loan.accountId);
  const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === 'active';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isOverdue ? 'destructive' : 'default';
      case 'completed':
        return 'secondary';
      case 'partially_paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return isOverdue ? <AlertTriangle className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'partially_paid':
        return <CreditCard className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <HandCoins className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'partially_paid':
        return 'Partially Paid';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              Loan Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant={loan.type === 'given' ? 'default' : 'secondary'}>
                {loan.type === 'given' ? 'Given Loan' : 'Taken Loan'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Borrower/Lender:</span>
              <span className="font-medium">{loan.borrowerName}</span>
            </div>
            {loan.borrowerContact && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-medium">{loan.borrowerContact}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-lg">{formatCurrency(loan.amount)}</span>
            </div>
            {loan.interestRate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium">{loan.interestRate}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium">{format(new Date(loan.startDate), 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className={`font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                {format(new Date(loan.dueDate), 'PPP')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={getStatusColor(loan.status)} className="flex items-center gap-1">
                {getStatusIcon(loan.status)}
                {getStatusText(loan.status)}
                {isOverdue && ' (Overdue)'}
              </Badge>
            </div>
            {loan.lastPaymentDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Payment:</span>
                <span className="font-medium">{format(new Date(loan.lastPaymentDate), 'PPP')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Account & Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account:</span>
            <span className="font-medium">{account?.name || 'Unknown Account'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining Amount:</span>
            <span className="font-bold text-lg">{formatCurrency(loan.remainingAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-medium text-green-600">{formatCurrency(loan.totalPaid)}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{((loan.totalPaid / loan.amount) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(loan.totalPaid / loan.amount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Calculation */}
      {loan.interestRate && loan.interestRate > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Calculator className="h-5 w-5" />
              Interest Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const calculation = getLoanCalculation(
                loan.amount,
                loan.interestRate,
                new Date(loan.startDate),
                new Date(loan.dueDate),
                'simple'
              );
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="font-medium">{formatCurrency(calculation.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="font-medium">{calculation.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Amount:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(calculation.interestAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total to Receive:</span>
                      <span className="font-bold text-green-600">{formatCurrency(calculation.totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        {loan.type === 'given' ? 'Total amount borrower will pay back' : 'Total amount you will pay back'}
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculation.totalAmount)}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {loan.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{loan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Installment Schedule */}
      <LoanInstallments loan={loan} />

      {/* Loan Payment (for non-installment loans) */}
      {!loan.isInstallment && <LoanPayment loan={loan} />}

      {/* Quick Repayment Option */}
      {loan.status !== 'completed' && loan.remainingAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Repayment</CardTitle>
            <CardDescription>
              Use the general repayment tool for this loan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoanRepayment />
          </CardContent>
        </Card>
      )}

      {children}
    </div>
  );
}
