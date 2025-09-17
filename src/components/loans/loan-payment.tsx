"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useCategories } from "@/contexts/category-context";
import { useCurrency } from "@/hooks/use-currency";
import { useNotifications } from "@/hooks/use-notifications";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import type { Loan } from "@/types";

interface LoanPaymentProps {
  loan: Loan;
}

export function LoanPayment({ loan }: LoanPaymentProps) {
  const { updateLoan } = useLoans();
  const { accounts } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(loan.remainingAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (!paymentAccountId || paymentAmount <= 0) return;
    
    setIsPaying(true);
    try {
      // Calculate new remaining amount
      const newRemainingAmount = Math.max(0, loan.remainingAmount - paymentAmount);
      const newTotalPaid = loan.totalPaid + paymentAmount;
      const isCompleted = newRemainingAmount === 0;
      
      // Update the loan
      await updateLoan(loan.id, {
        remainingAmount: newRemainingAmount,
        totalPaid: newTotalPaid,
        status: isCompleted ? 'completed' : 'active',
        lastPaymentDate: paymentDate,
      });
      
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
          name: `Loan ${loan.type === 'given' ? 'payment received' : 'payment made'} - ${loan.borrowerName}`,
          categoryId: fallbackCategory.id,
          date: paymentDate,
          amount: paymentAmount,
          type: loan.type === 'given' ? 'income' : 'expense',
          accountId: paymentAccountId,
        });
      } else {
        console.warn('No appropriate category found for loan payment transaction');
      }
      
      addNotification({
        icon: CheckCircle,
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(paymentAmount)} recorded successfully. ${isCompleted ? 'Loan completed!' : `${formatCurrency(newRemainingAmount)} remaining.`}`,
        variant: 'default',
      });
      
      setIsPaymentDialogOpen(false);
      setPaymentAmount(loan.remainingAmount);
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

  if (loan.status === 'completed' || loan.remainingAmount <= 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Make Payment
        </CardTitle>
        <CardDescription>
          Record a payment for this loan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Remaining Amount</Label>
              <Input
                value={formatCurrency(loan.remainingAmount)}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Total Paid</Label>
              <Input
                value={formatCurrency(loan.totalPaid)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          
          <Button 
            onClick={() => setIsPaymentDialogOpen(true)}
            className="w-full"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for this loan
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={loan.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum: {formatCurrency(loan.remainingAmount)}
                </p>
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
                onClick={handlePayment}
                disabled={isPaying || !paymentAccountId || paymentAmount <= 0}
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
