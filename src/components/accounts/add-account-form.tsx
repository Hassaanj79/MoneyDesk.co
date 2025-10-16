
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
import { useAccounts } from "@/contexts/account-context";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.enum(['bank', 'cash', 'credit-card', 'debit-card', 'paypal', 'zelle', 'cash-app', 'custom']),
  initialBalance: z.coerce.number().optional(),
});

type AddAccountFormProps = {
  onSuccess: (accountName: string) => void;
};

export function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const { addAccount, accounts } = useAccounts();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "bank",
      initialBalance: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check for duplicate account names (case-insensitive)
    const trimmedName = values.name.trim();
    const isDuplicate = accounts.some(account => 
      account.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      form.setError("name", {
        type: "manual",
        message: "An account with this name already exists"
      });
      return;
    }

    const accountData = {
      ...values,
      initialBalance: values.initialBalance ?? 0, // Default to 0 if undefined
    };
    await addAccount(accountData);
    onSuccess(values.name);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Savings Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="debit-card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="cash-app">Cash App</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Balance</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="Enter initial balance (can be negative)" 
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers, decimal point, and minus sign
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      field.onChange(value ? parseFloat(value) : undefined);
                    }
                  }}
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
              <div className="text-sm text-muted-foreground">
                Enter the current balance of this account. Use negative values for debts or overdrafts.
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Add Account
        </Button>
      </form>
    </Form>
  );
}
