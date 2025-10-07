
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Transaction } from "@/types";
import { useTransactions } from "@/contexts/transaction-context";
import { useAccounts } from "@/contexts/account-context";
import { useCategories } from "@/contexts/category-context";
import { useCurrency } from "@/hooks/use-currency";


const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().min(2, "Description is too short."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date(),
  accountId: z.string().min(1, "Please select an account."),
  categoryId: z.string().min(1, "Please select a category."),
});

type EditTransactionFormProps = {
  transaction: Transaction;
  onSuccess?: () => void;
};

export function EditTransactionForm({ transaction, onSuccess }: EditTransactionFormProps) {
  const { updateTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

  // Helper function to safely convert date to Date object
  const getDate = (dateValue: any): Date => {
    if (typeof dateValue === 'string') {
      return parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore timestamp
      return dateValue.toDate();
    } else if (dateValue && typeof dateValue.toISOString === 'function') {
      return new Date(dateValue.toISOString());
    }
    return new Date(); // fallback
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: getDate(transaction.date),
      amount: Math.abs(transaction.amount),
    },
  });

  const selectedAccountId = form.watch("accountId");
  
  // Get the selected account details
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await updateTransaction(transaction.id, {
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
    });
    onSuccess?.();
    
    // Auto refresh the page to ensure UI updates
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Wait 1 second to show the success message
  }

  const filteredCategories = categories.filter((c) => c.type === transaction.type);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee, Salary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <div>
                  <Popover>
                      <PopoverTrigger asChild>
                      <FormControl>
                          <Button
                          variant={"outline"}
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
                          initialFocus
                      />
                      </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Account</FormLabel>
                <div>
                  <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                  >
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <div className="flex flex-col">
                              <span>{acc.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Balance: {formatCurrency(acc.balance || 0)}
                              </span>
                            </div>
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
                {selectedAccount && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Current Balance: <span className="font-medium text-foreground">
                      {formatCurrency(selectedAccount.balance || 0)}
                    </span>
                  </div>
                )}
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
