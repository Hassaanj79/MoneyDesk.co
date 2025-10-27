
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, CalendarIcon, Upload, Camera, X, RefreshCw, Info, Bot } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingReceiptData, setPendingReceiptData] = useState<any>(null);
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

  // Function to get category suggestion
  const getCategorySuggestion = async (merchant: string, amount: number) => {
    try {
      const categoryResponse = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'category-suggestions',
          data: {
            transactionName: merchant,
            amount: amount,
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

  // Function to apply receipt data to form
  const applyReceiptData = (receiptData: any) => {
    if (!receiptData) return;
    
    const filledFields = new Set<string>();
    
    if (receiptData.merchant) {
      form.setValue("name", receiptData.merchant);
      filledFields.add("name");
      form.trigger("name");
    }
    
    const amountValue = receiptData.amount || receiptData.total;
    if (amountValue) {
      form.setValue("amount", amountValue);
      filledFields.add("amount");
      form.trigger("amount");
    }
    
    if (receiptData.date) {
      form.setValue("date", new Date(receiptData.date));
      filledFields.add("date");
      form.trigger("date");
    }
    
    setAutoFilledFields(filledFields);
    
    // Show success toast
    toast.success(`✅ Receipt processed! Auto-filled: ${Array.from(filledFields).join(', ')}`);
    
    // Category suggestion
    if (receiptData.merchant && amountValue) {
      getCategorySuggestion(receiptData.merchant, amountValue);
    }
  }

  const processReceiptOCR = async (imageData: string) => {
    if (!imageData) {
      console.error('No image data provided');
      toast.error('No receipt image uploaded');
      return;
    }

    setIsProcessingOCR(true);
    try {
      console.log('Starting OCR processing of uploaded image...');
      toast.info('Processing receipt with AI... Please wait.');
      
      // Extract text from the uploaded image using client-side OCR
      // (Image enhancement happens automatically by Tesseract OCR preprocessing)
      console.log('Extracting text from receipt image...');
      const ocrResult = await clientOCR.extractTextFromImage(imageData);
      
      console.log('OCR extracted text:', ocrResult.text);
      console.log('OCR text length:', ocrResult.text?.length);
      console.log('OCR confidence:', ocrResult.confidence);

      if (!ocrResult.text || ocrResult.text.trim().length < 5) {
        console.error('OCR failed: insufficient text extracted');
        toast.error('Could not extract text from the image. Please try a clearer image with better lighting.');
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

      if (!result.success) {
        console.error('Receipt parsing failed:', result.error);
        toast.error(result.error || 'Failed to process receipt with AI. Please try again.');
        setIsProcessingOCR(false);
        return;
      }

      if (result.success && result.data) {
        const receiptData = result.data;
        
        // Check if user has already entered data manually
        const currentValues = form.getValues();
        const hasManualEntry = (currentValues.name && currentValues.name.trim() !== '') || 
                               (currentValues.amount && currentValues.amount > 0);
        
        console.log('Current form values before update:', currentValues);
        console.log('Has manual entry:', hasManualEntry);
        console.log('Receipt data from AI:', receiptData);
        
        // If user has manual data, show confirmation dialog
        if (hasManualEntry) {
          setPendingReceiptData(receiptData);
          setShowConfirmDialog(true);
          setIsProcessingOCR(false);
          return;
        }
        
        // Auto-fill form fields with extracted data
        const filledFields = new Set<string>();
        
        console.log('Auto-filling form with data:', receiptData);
        
        if (receiptData.merchant) {
          console.log('Setting merchant name:', receiptData.merchant);
          form.setValue("name", receiptData.merchant);
          filledFields.add("name");
          // Force form to re-render
          form.trigger("name");
        }
        
        // Try both 'amount' and 'total' fields for the amount
        const amountValue = receiptData.amount || receiptData.total;
        if (amountValue) {
          console.log('Setting amount:', amountValue);
          form.setValue("amount", amountValue);
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
        if (receiptData.merchant && amountValue) {
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
        💰 Amount: ${formatCurrency(amountValue || 0)} 
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
    <>
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
                <p className="text-xs text-green-600">🤖 Auto-filled by MoneyDesk AI</p>
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
                <p className="text-xs text-green-600">🤖 Auto-filled by MoneyDesk AI</p>
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
                    <div className="space-y-1">
                        <FormLabel className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-purple-600" />
                            Smart Receipt
                        </FormLabel>
                        <p className="text-xs text-muted-foreground ml-6">
                            Upload or capture receipt image to auto-fill details with MoneyDesk AI
                        </p>
                    </div>
                    <FormControl>
                        {/* Receipt upload options */}
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
                        <div className="mt-4 relative w-full max-w-2xl">
                            <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                                <Image
                                    src={receiptPreview}
                                    alt="Receipt preview"
                                    width={800}
                                    height={1200}
                                    className="w-full h-auto object-contain"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                    onClick={() => form.setValue("receipt", null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
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

    {/* Confirmation Dialog for Overwriting Manual Data */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Use AI to Fill Form?</AlertDialogTitle>
          <AlertDialogDescription>
            You've already entered transaction details manually. Would you like to replace them with data from the receipt image using MoneyDesk AI?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pendingReceiptData && (
          <div className="text-sm space-y-1 py-2">
            <p><strong>Merchant:</strong> {pendingReceiptData.merchant || 'Unknown'}</p>
            <p><strong>Amount:</strong> {formatCurrency((pendingReceiptData.amount || pendingReceiptData.total || 0))}</p>
            <p><strong>Date:</strong> {pendingReceiptData.date || 'Today'}</p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowConfirmDialog(false);
            setPendingReceiptData(null);
            toast.info('Your manual entries are preserved');
          }}>
            Keep Manual Entry
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            if (pendingReceiptData) {
              applyReceiptData(pendingReceiptData);
            }
            setShowConfirmDialog(false);
            setPendingReceiptData(null);
          }}>
            Use AI Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
