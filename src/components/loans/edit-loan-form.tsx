"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
// import { useNotifications } from "@/contexts/notification-context";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";
import { useState, useEffect } from "react";
import type { Loan } from "@/types";

const editLoanSchema = z.object({
  borrowerName: z.string().min(2, "Borrower name must be at least 2 characters."),
  borrowerContact: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0."),
  interestRate: z.number().min(0, "Interest rate must be 0 or greater.").optional(),
  startDate: z.date(),
  dueDate: z.date(),
  description: z.string().optional(),
  accountId: z.string().min(1, "Please select an account."),
  status: z.enum(['active', 'completed', 'overdue']),
});

interface EditLoanFormProps {
  loan: Loan;
  onSuccess: () => void;
}

export function EditLoanForm({ loan, onSuccess }: EditLoanFormProps) {
  const { updateLoan } = useLoans();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, addTransaction } = useTransactions();
  const { categories } = useCategories();
  // const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);

  // Calculate current balance for each account
  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;
    
    const accountTransactions = transactions.filter(t => t.accountId === accountId);
    const currentBalance = account.initialBalance + accountTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    return currentBalance;
  };

  const form = useForm<z.infer<typeof editLoanSchema>>({
    resolver: zodResolver(editLoanSchema),
    defaultValues: {
      borrowerName: loan.borrowerName,
      borrowerContact: loan.borrowerContact || "",
      amount: loan.amount,
      interestRate: loan.interestRate || 0,
      startDate: new Date(loan.startDate),
      dueDate: new Date(loan.dueDate),
      description: loan.description || "",
      accountId: loan.accountId,
      status: loan.status,
    },
  });

  async function onSubmit(values: z.infer<typeof editLoanSchema>) {
    setLoading(true);
    try {
      const wasCompleted = loan.status !== 'completed' && values.status === 'completed';
      
      await updateLoan(loan.id, {
        borrowerName: values.borrowerName,
        borrowerContact: values.borrowerContact,
        amount: values.amount,
        interestRate: values.interestRate,
        startDate: values.startDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        description: values.description,
        accountId: values.accountId,
        status: values.status,
        remainingAmount: values.status === 'completed' ? 0 : values.amount - loan.totalPaid,
        totalPaid: values.status === 'completed' ? values.amount : loan.totalPaid,
      });

      // If loan was just completed, create a transaction to return the money
      if (wasCompleted) {
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
            name: `Loan ${loan.type === 'given' ? 'repaid by' : 'repaid to'} ${values.borrowerName}`,
            categoryId: fallbackCategory.id,
            date: new Date().toISOString(),
            amount: values.amount,
            type: loan.type === 'given' ? 'income' : 'expense',
            accountId: values.accountId,
          });
        } else {
          console.warn(`No ${loan.type === 'given' ? 'income' : 'expense'} category found for loan completion transaction`);
        }
      }

      // addNotification({
      //   type: 'loan_updated',
      //   title: "Loan Updated",
      //   message: `Loan with ${values.borrowerName} has been updated successfully.${wasCompleted ? ' Money returned to account.' : ''}`,
      //   navigationPath: '/loans',
      //   navigationParams: { id: loan.id },
      //   relatedEntityId: loan.id,
      //   relatedEntityType: 'loan'
      // });

      onSuccess();
    } catch (error) {
      console.error("Error updating loan:", error);
      // addNotification({
      //   type: 'error',
      //   title: "Error",
      //   message: "Failed to update loan. Please try again.",
      //   navigationPath: '/loans'
      // });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="borrowerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Borrower/Lender Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormDescription>
                  {loan.type === 'given' ? 'Name of the person you lent money to' : 'Name of the person you borrowed from'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="borrowerContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Information</FormLabel>
                <FormControl>
                  <Input placeholder="Phone, email, etc." {...field} />
                </FormControl>
                <FormDescription>
                  Optional contact information for the borrower/lender.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Amount *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  The total amount of the loan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Annual interest rate (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick a start date"
                  />
                </FormControl>
                <FormDescription>
                  When the loan was given/taken.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick a due date"
                  />
                </FormControl>
                <FormDescription>
                  When the loan should be repaid.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account *</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  disabled={accountsLoading}
                >
                  <option value="">
                    {accountsLoading ? "Loading accounts..." : "Select an account"}
                  </option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(getAccountBalance(account.id))}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                {loan.type === 'given' ? 'Account the loan was given from' : 'Account the loan was received into'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </FormControl>
              <FormDescription>
                Current status of the loan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about the loan..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description or notes about the loan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Loan
          </Button>
        </div>
      </form>
    </Form>
  );
}
