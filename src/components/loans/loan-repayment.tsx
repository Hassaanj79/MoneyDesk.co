"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useCategories } from "@/contexts/category-context";
import { useCurrency } from "@/hooks/use-currency";
// import { useNotifications } from "@/contexts/notification-context";
import { CreditCard, CheckCircle, AlertCircle, ArrowUpDown, Users, User } from "lucide-react";
import type { Loan } from "@/types";

interface LoanRepaymentProps {
  onSuccess?: () => void;
}

export function LoanRepayment({ onSuccess }: LoanRepaymentProps) {
  const { loans, updateLoan } = useLoans();
  const { accounts } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();
  // const { addNotification } = useNotifications();
  
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  const [repaymentType, setRepaymentType] = useState<"pay" | "receive">("pay");
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bulk repayment state
  const [repaymentMode, setRepaymentMode] = useState<"single" | "bulk">("single");
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState<Record<string, number>>({});

  // Filter loans based on repayment type
  const availableLoans = loans.filter(loan => {
    if (repaymentType === "pay") {
      // For paying back loans, show only taken loans that are not completed
      return loan.type === 'taken' && loan.status !== 'completed' && loan.remainingAmount > 0;
    } else {
      // For receiving payments, show only given loans that are not completed
      return loan.type === 'given' && loan.status !== 'completed' && loan.remainingAmount > 0;
    }
  });

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  const handleRepayment = async () => {
    if (!selectedLoan || !paymentAccountId || paymentAmount <= 0) return;
    
    setIsProcessing(true);
    try {
      // Calculate new remaining amount
      const newRemainingAmount = Math.max(0, selectedLoan.remainingAmount - paymentAmount);
      const newTotalPaid = selectedLoan.totalPaid + paymentAmount;
      const isCompleted = newRemainingAmount === 0;
      
      // Update the loan
      await updateLoan(selectedLoan.id, {
        remainingAmount: newRemainingAmount,
        totalPaid: newTotalPaid,
        status: isCompleted ? 'completed' : 'active',
        lastPaymentDate: paymentDate,
      });
      
      // Create a transaction for the payment
      const loanCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('loan') && 
        cat.type === (repaymentType === 'pay' ? 'expense' : 'income')
      );
      
      // If no loan category exists, find any appropriate category as fallback
      const fallbackCategory = loanCategory || categories.find(cat => 
        cat.type === (repaymentType === 'pay' ? 'expense' : 'income')
      );
      
      if (fallbackCategory) {
        await addTransaction({
          name: `Loan ${repaymentType === 'pay' ? 'payment made' : 'payment received'} - ${selectedLoan.borrowerName}`,
          categoryId: fallbackCategory.id,
          date: paymentDate,
          amount: paymentAmount,
          type: repaymentType === 'pay' ? 'expense' : 'income',
          accountId: paymentAccountId,
        });
      } else {
        console.warn('No appropriate category found for loan repayment transaction');
      }
      
      // addNotification({
      //   type: 'repayment_recorded',
      //   title: 'Repayment Recorded',
      //   message: `${repaymentType === 'pay' ? 'Payment' : 'Received payment'} of ${formatCurrency(paymentAmount)} recorded successfully. ${isCompleted ? 'Loan completed!' : `${formatCurrency(newRemainingAmount)} remaining.`}`,
      //   navigationPath: '/loans',
      //   navigationParams: { id: selectedLoan?.id },
      //   relatedEntityId: selectedLoan?.id,
      //   relatedEntityType: 'loan'
      // });
      
      // Reset form
      setSelectedLoanId("");
      setPaymentAmount(0);
      setPaymentAccountId("");
      setIsRepaymentDialogOpen(false);
      onSuccess?.();
    } catch (error) {
      // addNotification({
      //   type: 'error',
      //   title: 'Repayment Failed',
      //   message: 'Failed to record repayment. Please try again.',
      //   navigationPath: '/loans'
      // });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoanChange = (loanId: string) => {
    setSelectedLoanId(loanId);
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setPaymentAmount(loan.remainingAmount);
    }
  };

  // Bulk repayment functions
  const handleBulkLoanToggle = (loanId: string, checked: boolean) => {
    if (checked) {
      setSelectedLoans(prev => [...prev, loanId]);
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        setBulkPaymentAmount(prev => ({
          ...prev,
          [loanId]: loan.remainingAmount
        }));
      }
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId));
      setBulkPaymentAmount(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[loanId];
        return newAmounts;
      });
    }
  };

  const handleBulkAmountChange = (loanId: string, amount: number) => {
    setBulkPaymentAmount(prev => ({
      ...prev,
      [loanId]: amount
    }));
  };

  const handleBulkRepayment = async () => {
    if (selectedLoans.length === 0 || !paymentAccountId) return;
    
    setIsProcessing(true);
    try {
      const results = [];
      
      for (const loanId of selectedLoans) {
        const loan = loans.find(l => l.id === loanId);
        const amount = bulkPaymentAmount[loanId];
        
        if (!loan || !amount || amount <= 0) continue;
        
        // Calculate new remaining amount
        const newRemainingAmount = Math.max(0, loan.remainingAmount - amount);
        const newTotalPaid = loan.totalPaid + amount;
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
          cat.type === (repaymentType === 'pay' ? 'expense' : 'income')
        );
        
        const fallbackCategory = loanCategory || categories.find(cat => 
          cat.type === (repaymentType === 'pay' ? 'expense' : 'income')
        );
        
        if (fallbackCategory) {
          await addTransaction({
            name: `Loan ${repaymentType === 'pay' ? 'payment made' : 'payment received'} - ${loan.borrowerName}`,
            categoryId: fallbackCategory.id,
            date: paymentDate,
            amount: amount,
            type: repaymentType === 'pay' ? 'expense' : 'income',
            accountId: paymentAccountId,
          });
        }
        
        results.push({ loanId, amount, completed: isCompleted });
      }
      
      // Reset form
      setSelectedLoans([]);
      setBulkPaymentAmount({});
      setPaymentAccountId("");
      setIsRepaymentDialogOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Bulk repayment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsRepaymentDialogOpen(true)}
        className="flex items-center gap-2"
        variant="outline"
      >
        <ArrowUpDown className="h-4 w-4" />
        Loan Repayment
      </Button>

      <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Repayment</DialogTitle>
            <DialogDescription>
              Record a loan payment or receive a loan repayment
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={repaymentMode} onValueChange={(value: "single" | "bulk") => {
            setRepaymentMode(value);
            setSelectedLoanId("");
            setSelectedLoans([]);
            setBulkPaymentAmount({});
            setPaymentAmount(0);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Single Repayment
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bulk Repayment
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
            {/* Repayment Type Selection */}
            <div>
              <Label>Repayment Type</Label>
              <Select value={repaymentType} onValueChange={(value: "pay" | "receive") => {
                setRepaymentType(value);
                setSelectedLoanId("");
                setPaymentAmount(0);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pay">Pay Back Loan (I owe money)</SelectItem>
                  <SelectItem value="receive">Receive Payment (I lent money)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loan Selection */}
            <div>
              <Label>Select Loan *</Label>
              <Select value={selectedLoanId} onValueChange={handleLoanChange} disabled={availableLoans.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={availableLoans.length === 0 ? "No loans available" : "Choose a loan"} />
                </SelectTrigger>
                <SelectContent>
                  {availableLoans.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No {repaymentType === 'pay' ? 'loans to pay back' : 'loans to receive payments from'} available
                      </p>
                    </div>
                  ) : (
                    availableLoans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{loan.borrowerName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(loan.remainingAmount)} remaining
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Details */}
            {selectedLoan && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Borrower/Lender:</span>
                  <span>{selectedLoan.borrowerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Original Amount:</span>
                  <span>{formatCurrency(selectedLoan.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Remaining Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedLoan.remainingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Paid:</span>
                  <span>{formatCurrency(selectedLoan.totalPaid)}</span>
                </div>
                {selectedLoan.interestRate && selectedLoan.interestRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Interest Rate:</span>
                    <span>{selectedLoan.interestRate}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <Label>Payment Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedLoan?.remainingAmount || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              {selectedLoan && (
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum: {formatCurrency(selectedLoan.remainingAmount)}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            {/* Account Selection */}
            <div>
              <Label>Account *</Label>
              <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(account.balance || 0)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-4">
              {/* Repayment Type Selection */}
              <div>
                <Label>Repayment Type</Label>
                <Select value={repaymentType} onValueChange={(value: "pay" | "receive") => {
                  setRepaymentType(value);
                  setSelectedLoans([]);
                  setBulkPaymentAmount({});
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay">Pay Back Loans (I owe money)</SelectItem>
                    <SelectItem value="receive">Receive Payments (I lent money)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Loan Selection */}
              <div>
                <Label>Select Loans *</Label>
                {availableLoans.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      No {repaymentType === 'pay' ? 'loans to pay back' : 'loans to receive payments from'} available
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {availableLoans.map((loan) => (
                      <div key={loan.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                        <Checkbox
                          id={`loan-${loan.id}`}
                          checked={selectedLoans.includes(loan.id)}
                          onCheckedChange={(checked) => handleBulkLoanToggle(loan.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <label htmlFor={`loan-${loan.id}`} className="font-medium cursor-pointer">
                                {loan.borrowerName}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(loan.remainingAmount)} remaining
                              </p>
                            </div>
                            {selectedLoans.includes(loan.id) && (
                              <div className="w-32">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={loan.remainingAmount}
                                  value={bulkPaymentAmount[loan.id] || 0}
                                  onChange={(e) => handleBulkAmountChange(loan.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedLoans.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedLoans.length} loan{selectedLoans.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              {/* Account Selection */}
              <div>
                <Label>Account *</Label>
                <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(account.balance || 0)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRepaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            {repaymentMode === "single" ? (
              <Button
                onClick={handleRepayment}
                disabled={isProcessing || !selectedLoanId || !paymentAccountId || paymentAmount <= 0}
              >
                {isProcessing ? 'Processing...' : 'Record Repayment'}
              </Button>
            ) : (
              <Button
                onClick={handleBulkRepayment}
                disabled={isProcessing || selectedLoans.length === 0 || !paymentAccountId}
              >
                {isProcessing ? 'Processing...' : `Record ${selectedLoans.length} Repayment${selectedLoans.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
