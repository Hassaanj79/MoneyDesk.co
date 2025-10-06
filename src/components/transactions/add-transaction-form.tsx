
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, CalendarIcon, Upload, Camera, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import type { Category } from "@/types";
import { useTransactions } from "@/contexts/transaction-context";
// import { useNotifications } from "@/contexts/notification-context";
import { useCurrency } from "@/hooks/use-currency";
import { useEffect, useRef, useState } from "react";
import { useAccounts } from "@/contexts/account-context";
import { useCategories } from "@/contexts/category-context";
import { useAIFeatures } from "@/hooks/use-ai-features";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { CameraCapture } from "./camera-capture";
import { CategorySuggestions } from "./category-suggestions";
import Image from "next/image";
import { toast } from "sonner";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().min(2, "Description is too short."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date(),
  accountId: z.string().min(1, "Please select an account."),
  categoryId: z.string().min(1, "Please select a category."),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.string().optional(),
  receipt: z.any().optional(),
});

type AddTransactionFormProps = {
  type: "income" | "expense";
  onSuccess?: () => void;
};

export function AddTransactionForm({ type, onSuccess }: AddTransactionFormProps) {
  const { addTransaction, categorizeTransaction, detectDuplicate } = useTransactions();
  // const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();
  const { categories, addCategory } = useCategories();
  const { user } = useAuth();
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: type,
      amount: '' as any,
      date: new Date(),
      accountId: "",
      categoryId: "",
      name: "",
      isRecurring: false,
    },
  });

  useEffect(() => {
    form.reset({
      type: type,
      amount: '' as any,
      date: new Date(),
      accountId: "",
      categoryId: "",
      name: "",
      isRecurring: false,
    });
    setResetTrigger(prev => prev + 1); // Trigger suggestions reset
  }, [type, form]);
  

  const isRecurring = form.watch("isRecurring");
  const receiptPreview = form.watch("receipt");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { receipt, ...transactionData } = values;

      const transactionPayload = {
        ...transactionData,
        date: format(values.date, "yyyy-MM-dd"),
      };

      // Check for duplicates before adding
      const isDuplicate = detectDuplicate(transactionPayload);
      if (isDuplicate) {
        toast.warning('This transaction might be a duplicate. Please review before saving.');
        // Still allow saving, but warn the user
      }

      await addTransaction(transactionPayload);

      // addNotification({
      //   type: 'transaction_created',
      //   title: `Transaction Added`,
      //   message: `${values.name} for ${formatCurrency(values.amount)} has been saved.`,
      //   navigationPath: '/transactions',
      //   navigationParams: { id: transactionId },
      //   relatedEntityId: transactionId,
      //   relatedEntityType: 'transaction'
      // });

      onSuccess?.();
      form.reset();
      setResetTrigger(prev => prev + 1); // Clear suggestions after successful submission
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    }
  }

  const handlePhotoSelect = (photoDataUrl: string) => {
    form.setValue("receipt", photoDataUrl);
    setCameraOpen(false);
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  // Handle AI category selection - create if doesn't exist
  const handleAiCategorySelect = async (categoryName: string) => {
    try {
      // First, try to find existing category
      let category = categories.find(c => c.name === categoryName && c.type === type);
      
      if (!category) {
        // Category doesn't exist, create it
        const newCategory = {
          name: categoryName,
          type: type,
          color: '#3B82F6', // Default blue color
          icon: 'tag' // Default icon
        };
        
        // Add the new category
        const categoryId = await addCategory(newCategory);
        if (categoryId) {
          // Wait a moment for the categories list to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try to find the newly created category in the updated list
          category = categories.find(c => c.id === categoryId);
          if (!category) {
            // If still not found, create a temporary object with the correct ID
            category = {
              id: categoryId,
              name: categoryName,
              type: type,
              color: '#3B82F6',
              icon: 'tag',
              userId: user?.uid || '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
      }
      
      if (category) {
        form.setValue('categoryId', category.id);
        // Force form to re-render by triggering a change event
        form.trigger('categoryId');
        const action = categories.some(c => c.name === categoryName && c.type === type) ? 'selected' : 'created and selected';
        toast.success(`Category "${categoryName}" ${action}!`);
      }
    } catch (error) {
      console.error('Error handling AI category selection:', error);
      toast.error('Failed to select category. Please try again.');
    }
  };

  // Handle adding new category from AI suggestions
  const handleAddNewCategory = async (categoryName: string) => {
    try {
      const newCategory = {
        name: categoryName,
        type: type,
        color: '#3B82F6', // Default blue color
        icon: 'tag' // Default icon
      };
      
      // Add the new category
      const categoryId = await addCategory(newCategory);
      if (categoryId) {
        // Wait a moment for the categories list to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the newly created category and select it
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          form.setValue('categoryId', category.id);
          // Force form to re-render by triggering a change event
          form.trigger('categoryId');
          toast.success(`Category "${categoryName}" created and selected!`);
        }
      }
    } catch (error) {
      console.error('Error creating new category:', error);
      toast.error('Failed to create category. Please try again.');
    }
  };

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
                <Input 
                  placeholder="e.g., Coffee, Salary" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* AI Category Suggestions */}
        <CategorySuggestions
          description={form.watch("name") || ""}
          type={type}
          existingCategories={filteredCategories.map(c => c.name)}
          onSelectCategory={handleAiCategorySelect}
          onAddNewCategory={handleAddNewCategory}
          disabled={!form.watch("name") || form.watch("name").length < 3}
          resetTrigger={resetTrigger}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} step="0.01"/>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Select onValueChange={field.onChange} value={field.value}>
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
        
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Recurring Transaction</FormLabel>
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

        {isRecurring && (
          <div className="rounded-lg border p-3 shadow-sm">
            <FormField
              control={form.control}
              name="recurrenceFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {type === 'expense' && (
            <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Receipt</FormLabel>
                    <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                className="sr-only" 
                                ref={fileInputRef} 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            form.setValue("receipt", reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />

                            <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" type="button">
                                        <Camera className="mr-2 h-4 w-4" />
                                        Capture Image
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Capture Receipt</DialogTitle>
                                </DialogHeader>
                                <CameraCapture onPhotoTaken={handlePhotoSelect} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </FormControl>
                     {receiptPreview && (
                        <div className="mt-4 relative w-48 h-48">
                            <Image
                                src={receiptPreview}
                                alt="Receipt preview"
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md border"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => form.setValue("receipt", null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <FormMessage />
                </FormItem>
                )}
            />
        )}


        <Button type="submit" className="w-full">
          Add Transaction
        </Button>
      </form>
    </Form>
  );
}
