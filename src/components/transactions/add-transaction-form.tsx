
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
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { CameraCapture } from "./camera-capture";
import { SmartCategorySelector } from "./smart-category-selector";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { clientOCR } from "@/services/client-ocr";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().min(2, "Description is too short."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date(),
  accountId: z.string().min(1, "Please select an account."),
  categoryId: z.string().min(1, "Please select a category."),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  receipt: z.any().optional(),
});

type AddTransactionFormProps = {
  type: "income" | "expense";
  onSuccess?: () => void;
};

export function AddTransactionForm({ type, onSuccess }: AddTransactionFormProps) {
  const { addTransaction } = useTransactions();
  // const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();
  const { categories, addCategory } = useCategories();
  const { user } = useAuth();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: type,
      amount: 0,
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
      amount: 0,
      date: new Date(),
      accountId: "",
      categoryId: "",
      name: "",
      isRecurring: false,
    });
  }, [type, form]);
  

  const isRecurring = form.watch("isRecurring");
  const receiptPreview = form.watch("receipt");
  const selectedAccountId = form.watch("accountId");
  
  // Get the selected account details
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log('Form submitted with values:', values);
      
      const { receipt, ...transactionData } = values;

      // Filter out undefined values to prevent Firebase errors
      const transactionPayload: any = {
        ...transactionData,
        date: values.date, // Keep as Date object
      };

      // Only add recurrenceFrequency if it's defined and isRecurring is true
      if (values.isRecurring && values.recurrenceFrequency) {
        transactionPayload.recurrenceFrequency = values.recurrenceFrequency;
      }

      console.log('Submitting transaction payload:', transactionPayload);
      const result = await addTransaction(transactionPayload);
      console.log('Transaction added successfully:', result);

      toast.success('Transaction added successfully!');
      onSuccess?.();
      form.reset();
      
      // Reset auto-filled fields state
      setAutoFilledFields(new Set());
      
      // Auto refresh the page to ensure UI updates
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Wait 1 second to show the success message
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    }
  }

  const handlePhotoSelect = (photoDataUrl: string) => {
    form.setValue("receipt", photoDataUrl);
    setCameraOpen(false);
    // Process OCR for captured photo
    processReceiptOCR(photoDataUrl);
  }

  const processReceiptOCR = async (imageData: string) => {
    if (!imageData) return;

    setIsProcessingOCR(true);
    try {
      console.log('Starting OCR processing of uploaded image...');
      
      // Extract text from the actual uploaded image using client-side OCR
      const ocrResult = await clientOCR.extractTextFromImage(imageData);
      
      console.log('OCR extracted text:', ocrResult.text);
      console.log('OCR confidence:', ocrResult.confidence);

      if (!ocrResult.text || ocrResult.text.trim().length < 5) {
        toast.error('Could not extract text from the image. Please try a clearer image.');
        return;
      }

      // Use Gemini AI to process the extracted text
      const response = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'receipt-parsing',
          data: { receiptText: ocrResult.text }
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const receiptData = result.data;
        
        // Auto-fill form fields with extracted data
        const filledFields = new Set<string>();
        
        console.log('Auto-filling form with data:', receiptData);
        console.log('Current form values before update:', form.getValues());
        
        if (receiptData.merchant) {
          console.log('Setting merchant name:', receiptData.merchant);
          form.setValue("name", receiptData.merchant);
          filledFields.add("name");
          // Force form to re-render
          form.trigger("name");
        }
        
        if (receiptData.amount) {
          console.log('Setting amount:', receiptData.amount);
          form.setValue("amount", receiptData.amount);
          filledFields.add("amount");
          // Force form to re-render
          form.trigger("amount");
        }
        
        if (receiptData.date) {
          console.log('Setting date:', receiptData.date);
          form.setValue("date", new Date(receiptData.date));
          filledFields.add("date");
          // Force form to re-render
          form.trigger("date");
        }
        
        console.log('Auto-filled fields:', Array.from(filledFields));
        console.log('Form values after update:', form.getValues());
        setAutoFilledFields(filledFields);

        // Add a small delay to ensure form updates are visible
        setTimeout(() => {
          console.log('Form values after delay:', form.getValues());
        }, 100);

        // Get AI-powered category suggestion
        if (receiptData.merchant && receiptData.amount) {
          try {
            const categoryResponse = await fetch('/api/gemini-ai', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'category-suggestions',
                data: {
                  transactionName: receiptData.merchant,
                  amount: receiptData.amount,
                  existingCategories: filteredCategories.map(c => c.name)
                }
              }),
            });

            const categoryResult = await categoryResponse.json();
            if (categoryResult.success && categoryResult.suggestions.length > 0) {
              const suggestedCategory = categoryResult.suggestions[0];
              const matchingCategory = filteredCategories.find(c => 
                c.name.toLowerCase() === suggestedCategory.category.toLowerCase()
              );
              
              if (matchingCategory) {
                form.setValue("categoryId", matchingCategory.id);
                toast.success(`AI suggested category: ${suggestedCategory.category}`);
              }
            }
          } catch (categoryError) {
            console.warn('Failed to get category suggestion:', categoryError);
          }
        }

        // Show success message with extracted data
        const fieldNames = Array.from(filledFields).map(field => {
          switch(field) {
            case 'name': return 'Merchant Name';
            case 'amount': return 'Amount';
            case 'date': return 'Date';
            default: return field;
          }
        });
        const autoFilledText = fieldNames.length > 0 ? `Auto-filled: ${fieldNames.join(', ')}` : 'No fields auto-filled';
        
        toast.success(`✅ Receipt processed successfully! 
        📝 Merchant: ${receiptData.merchant || 'Unknown'} 
        💰 Amount: ${formatCurrency(receiptData.amount || 0)} 
        📅 Date: ${receiptData.date || 'Today'}
        🤖 ${autoFilledText}
        
        Check the form fields above - they should now be filled!`, {
          duration: 8000, // Show longer so user can see it
        });
        
        // Log the extracted data for debugging
        console.log('AI extracted data:', receiptData);
        console.log('Raw OCR text:', ocrResult.text);
      } else {
        toast.error(result.error || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type);



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
                  className={autoFilledFields.has('name') ? 'bg-green-50 border-green-200' : ''}
                />
              </FormControl>
              {autoFilledFields.has('name') && (
                <p className="text-xs text-green-600">🤖 Auto-filled by OCR</p>
              )}
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
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  step="0.01"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${autoFilledFields.has('amount') ? 'bg-green-50 border-green-200' : ''}`}
                />
              </FormControl>
              {autoFilledFields.has('amount') && (
                <p className="text-xs text-green-600">🤖 Auto-filled by OCR</p>
              )}
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
              <SmartCategorySelector
                value={field.value}
                onChange={field.onChange}
                transactionType={form.watch("type")}
                transactionName={form.watch("name")}
                onFormUpdate={(categoryId) => {
                  form.setValue("categoryId", categoryId);
                  field.onChange(categoryId);
                }}
              />
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
                    <p className="text-sm text-muted-foreground mb-2">
                        <strong>Smart Receipt Processing:</strong> Upload or capture a receipt image to automatically extract transaction details using OCR + AI. 
                        The system will read your actual receipt and auto-fill the merchant name, amount, date, and suggest a category.
                        <br />
                        <span className="text-xs text-blue-600">💡 You can still manually enter details if preferred - OCR is optional!</span>
                    </p>
                    <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant="outline" 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessingOCR}
                            >
                                {isProcessingOCR ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                {isProcessingOCR ? 'Processing...' : 'Upload Image'}
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
                                            const imageData = reader.result as string;
                                            form.setValue("receipt", imageData);
                                            // Process OCR for uploaded file
                                            processReceiptOCR(imageData);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />

                            <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        type="button"
                                        disabled={isProcessingOCR}
                                    >
                                        {isProcessingOCR ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="mr-2 h-4 w-4" />
                                        )}
                                        {isProcessingOCR ? 'Processing...' : 'Capture Image'}
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
