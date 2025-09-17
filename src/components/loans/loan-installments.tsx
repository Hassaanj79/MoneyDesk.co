"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoanInstallments } from "@/contexts/loan-installment-context";
import { useCurrency } from "@/hooks/use-currency";
import { useNotifications } from "@/hooks/use-notifications";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useCategories } from "@/contexts/category-context";
import { Calendar, CheckCircle, Clock, AlertCircle, CreditCard } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import type { Loan, LoanInstallment } from "@/types";

interface LoanInstallmentsProps {
  loan: Loan;
}

export function LoanInstallments({ loan }: LoanInstallmentsProps) {
  const { getInstallmentsByLoan, payInstallmentPayment, loading } = useLoanInstallments();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { accounts } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const installments = getInstallmentsByLoan(loan.id);
  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const paidInstallments = installments.filter(i => i.status === 'paid');
  const overdueInstallments = installments.filter(i => {
    if (i.status === 'paid') return false;
    return isBefore(new Date(i.dueDate), new Date());
  });

  const handlePayInstallment = async () => {
    if (!selectedInstallment || !paymentAccountId) return;
    
    setIsPaying(true);
    try {
      // Record the installment payment
      await payInstallmentPayment(selectedInstallment.id, paymentDate);
      
      // Create a transaction for the payment
      const loanCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('loan') && 
        cat.type === (loan.type === 'given' ? 'income' : 'expense')
      );
      
      // If no loan category exists, find any appropriate category as fallback
      const fallbackCategory = loanCategory || categories.find(cat => 
        cat.type === (loan.type === 'given' ? 'income' : 'expense')
      );
      
      if (fallbackCategory) {
        await addTransaction({
          name: `Loan ${loan.type === 'given' ? 'payment received' : 'payment made'} - Installment #${selectedInstallment.installmentNumber}`,
          categoryId: fallbackCategory.id,
          date: paymentDate,
          amount: selectedInstallment.amount,
          type: loan.type === 'given' ? 'income' : 'expense',
          accountId: paymentAccountId,
        });
      } else {
        console.warn('No appropriate category found for loan payment transaction');
      }
      
      addNotification({
        icon: CheckCircle,
        title: 'Payment Recorded',
        description: `Installment #${selectedInstallment.installmentNumber} payment recorded successfully.`,
        variant: 'default',
      });
      
      setIsPaymentDialogOpen(false);
      setSelectedInstallment(null);
      setPaymentAccountId("");
    } catch (error) {
      addNotification({
        icon: AlertCircle,
        title: 'Payment Failed',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusIcon = (installment: LoanInstallment) => {
    if (installment.status === 'paid') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (isBefore(new Date(installment.dueDate), new Date())) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (installment: LoanInstallment) => {
    if (installment.status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
    }
    
    if (isBefore(new Date(installment.dueDate), new Date())) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (!loan.isInstallment || installments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Installment Schedule
        </CardTitle>
        <CardDescription>
          Payment schedule for this installment loan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{paidInstallments.length}</div>
            <div className="text-sm text-green-600">Paid</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingInstallments.length}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{overdueInstallments.length}</div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
        </div>

        {/* Installments List */}
        <div className="space-y-2">
          {installments.map((installment) => (
            <div
              key={installment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(installment)}
                <div>
                  <div className="font-medium">
                    Installment #{installment.installmentNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Due: {format(new Date(installment.dueDate), 'MMM dd, yyyy')}
                    {installment.paidDate && (
                      <span className="ml-2">
                        • Paid: {format(new Date(installment.paidDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(installment.amount)}
                  </div>
                  {getStatusBadge(installment)}
                </div>
                
                {installment.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedInstallment(installment);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    Pay
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record payment for Installment #{selectedInstallment?.installmentNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  value={formatCurrency(selectedInstallment?.amount || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Account *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance || 0)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayInstallment}
                disabled={isPaying || !paymentAccountId}
              >
                {isPaying ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
