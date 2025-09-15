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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useTransactions } from "@/contexts/transaction-context";
import { useNotifications } from "@/hooks/use-notifications";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";
import { LoanCalculationDisplay } from "./loan-calculation-display";
import { useState } from "react";

const giveLoanSchema = z.object({
  borrowerName: z.string().min(2, "Borrower name must be at least 2 characters."),
  borrowerContact: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0."),
  interestRate: z.number().min(0).max(100).optional(),
  startDate: z.date(),
  dueDate: z.date(),
  description: z.string().optional(),
  accountId: z.string().min(1, "Please select an account."),
});

export function GiveLoanForm() {
  const { addLoan } = useLoans();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { addNotification } = useNotifications();
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

  const form = useForm<z.infer<typeof giveLoanSchema>>({
    resolver: zodResolver(giveLoanSchema),
    defaultValues: {
      borrowerName: "",
      borrowerContact: "",
      amount: 0,
      interestRate: 0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: "",
      accountId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof giveLoanSchema>) {
    setLoading(true);
    
      try {
        // Calculate total amount to be received (principal + interest)
        const interestAmount = values.interestRate || 0;
        const totalAmountToReceive = values.amount + interestAmount;

      // Check if account has sufficient balance for the total amount
      const accountBalance = getAccountBalance(values.accountId);
      if (accountBalance < totalAmountToReceive) {
        addNotification({
          icon: AlertCircle,
          title: 'Insufficient Balance',
          description: `Account has ${formatCurrency(accountBalance)} but total loan amount (including interest) is ${formatCurrency(totalAmountToReceive)}. Please select a different account or reduce the loan amount.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create the loan with total amount (principal + interest)
      const loanId = await addLoan({
        type: 'given',
        borrowerName: values.borrowerName,
        borrowerContact: values.borrowerContact,
        amount: totalAmountToReceive, // Store total amount to be received
        interestRate: values.interestRate || 0,
        startDate: values.startDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        status: 'active',
        description: values.description,
        accountId: values.accountId,
        remainingAmount: totalAmountToReceive, // Total amount remaining to be paid back
        totalPaid: 0,
      });

      // Create a transaction to deduct the total amount (principal + interest) from the account
      const loanCategory = categories.find(cat => cat.name.toLowerCase().includes('loan') && cat.type === 'expense');
      
      // If no loan category exists, find any expense category as fallback
      const fallbackCategory = loanCategory || categories.find(cat => cat.type === 'expense');
      
      if (fallbackCategory) {
        await addTransaction({
          name: `Loan given to ${values.borrowerName} (Total: ${formatCurrency(totalAmountToReceive)})`,
          categoryId: fallbackCategory.id,
          date: values.startDate.toISOString(),
          amount: totalAmountToReceive, // Deduct total amount including interest
          type: 'expense',
          accountId: values.accountId,
        });
      } else {
        console.warn('No expense category found for loan transaction');
      }

      addNotification({
        icon: CheckCircle,
        title: 'Loan Given',
        description: `Successfully gave loan of ${formatCurrency(values.amount)} to ${values.borrowerName}. Total amount ${formatCurrency(totalAmountToReceive)} (including interest) deducted from account.`,
        variant: 'default',
      });

      form.reset();
    } catch (error) {
      console.error("Failed to give loan", error);
      addNotification({
        icon: AlertCircle,
        title: 'Error',
        description: 'Could not give loan. Please try again.',
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
                <FormLabel>Borrower Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter borrower's name" {...field} />
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
                  Optional contact information for the borrower.
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
                  Optional interest amount to be received (in {formatCurrency(0).replace(/[\d.,]/g, '').trim()}).
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
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
              <FormLabel>From Account *</FormLabel>
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
                Select the account to give the loan from.
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
          Give Loan
        </Button>
      </form>
    </Form>
  );
}
