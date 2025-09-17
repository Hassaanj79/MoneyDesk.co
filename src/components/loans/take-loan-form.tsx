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
import { Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useNotifications } from "@/hooks/use-notifications";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";
import { useLoanInstallments } from "@/contexts/loan-installment-context";
import { LoanCalculationDisplay } from "./loan-calculation-display";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const takeLoanSchema = z.object({
  borrowerName: z.string().min(2, "Lender name must be at least 2 characters."),
  borrowerContact: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0."),
  interestRate: z.number().min(0).max(100).optional(),
  startDate: z.date(),
  dueDate: z.date(),
  description: z.string().optional(),
  accountId: z.string().min(1, "Please select an account."),
  isInstallment: z.boolean().optional(),
  installmentCount: z.number().min(1).max(120).optional(),
  installmentFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

interface TakeLoanFormProps {
  onSuccess?: () => void;
}

export function TakeLoanForm({ onSuccess }: TakeLoanFormProps) {
  const { addLoan } = useLoans();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { generateLoanInstallments } = useLoanInstallments();
  const [loading, setLoading] = useState(false);

  // Get current balance for each account
  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.balance || 0;
  };

  const form = useForm<z.infer<typeof takeLoanSchema>>({
    resolver: zodResolver(takeLoanSchema),
    defaultValues: {
      borrowerName: "",
      borrowerContact: "",
      amount: 0,
      interestRate: 0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: "",
      accountId: "",
      isInstallment: false,
      installmentCount: 1,
      installmentFrequency: 'monthly',
    },
  });

  async function onSubmit(values: z.infer<typeof takeLoanSchema>) {
    setLoading(true);
    
    try {
      // Calculate total amount to be paid (principal + interest)
      const interestAmount = values.interestRate ? (values.amount * values.interestRate / 100) : 0;
      const totalAmountToPay = values.amount + interestAmount;

      // Create the loan
      const loanId = await addLoan({
        type: 'taken',
        borrowerName: values.borrowerName,
        borrowerContact: values.borrowerContact,
        amount: totalAmountToPay, // Store total amount to be paid
        interestRate: values.interestRate || 0,
        startDate: values.startDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        status: 'active',
        description: values.description,
        accountId: values.accountId,
        remainingAmount: totalAmountToPay, // Total amount remaining to be paid
        totalPaid: 0,
        isInstallment: values.isInstallment || false,
        installmentCount: values.installmentCount || 1,
        installmentAmount: values.isInstallment ? totalAmountToPay / (values.installmentCount || 1) : undefined,
        installmentFrequency: values.installmentFrequency || 'monthly',
        nextPaymentDate: values.isInstallment ? values.startDate.toISOString() : undefined,
      });

      // Generate installments if installment loan
      if (values.isInstallment && values.installmentCount && values.installmentCount > 1) {
        await generateLoanInstallments(loanId, {
          amount: values.amount, // Use principal amount for calculation
          installmentCount: values.installmentCount,
          installmentFrequency: values.installmentFrequency || 'monthly',
          startDate: values.startDate.toISOString(),
          interestRate: values.interestRate || 0,
        });
      }

      // Create a transaction to add the amount to the account
      const loanCategory = categories.find(cat => cat.name.toLowerCase().includes('loan') && cat.type === 'income');
      
      // If no loan category exists, find any income category as fallback
      const fallbackCategory = loanCategory || categories.find(cat => cat.type === 'income');
      
      if (fallbackCategory) {
        await addTransaction({
          name: `Loan taken from ${values.borrowerName}`,
          categoryId: fallbackCategory.id,
          date: values.startDate.toISOString(),
          amount: values.amount,
          type: 'income',
          accountId: values.accountId,
        });
      } else {
        console.warn('No income category found for loan transaction');
      }

      addNotification({
        icon: CreditCard,
        title: 'Loan Taken',
        description: `Successfully took loan of ${formatCurrency(values.amount)} from ${values.borrowerName}. Amount added to account.`,
        variant: 'default',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to take loan", error);
      addNotification({
        icon: CreditCard,
        title: 'Error',
        description: 'Could not take loan. Please try again.',
        variant: 'destructive',
      });
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
                <FormLabel>Lender Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lender's name" {...field} />
                </FormControl>
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
                  <Input placeholder="Phone or email" {...field} />
                </FormControl>
                <FormDescription>
                  Optional contact information for the lender.
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
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Amount</FormLabel>
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
                  Optional interest amount to be paid (in {formatCurrency(0).replace(/[\d.,]/g, '').trim()}).
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
              <FormLabel>To Account *</FormLabel>
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
                Select the account to receive the loan into.
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
                  placeholder="Optional description of the loan..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about the loan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Installment Options */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <FormField
            control={form.control}
            name="isInstallment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Installment Loan</FormLabel>
                  <FormDescription>
                    Enable to split the loan into multiple payments
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("isInstallment") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="installmentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Installments</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      How many payments to split the loan into
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installmentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often payments are due
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Loan Calculation Display */}
        {form.watch('amount') > 0 && form.watch('startDate') && form.watch('dueDate') && (
          <LoanCalculationDisplay
            principal={form.watch('amount')}
            interestRate={form.watch('interestRate') || 0}
            startDate={form.watch('startDate')}
            dueDate={form.watch('dueDate')}
            calculationType="simple"
          />
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Take Loan
        </Button>
      </form>
    </Form>
  );
}
