"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  date: z.date(),
});

type FormData = z.infer<typeof formSchema>;

export default function FormFieldUpdateTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
    },
  });

  const testReceiptProcessing = async () => {
    setIsProcessing(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('Testing receipt processing...');
      
      // Test the API endpoint
      const response = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receipt-parsing',
          data: { 
            receiptText: `STARBUCKS LAHORE
Grande Latte $4.50
Tax $0.50
Total $5.00
Date: 2024-01-15` 
          }
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success && result.data) {
        const receiptData = result.data;
        
        // Simulate form field updates
        const filledFields = new Set<string>();
        
        console.log('Auto-filling form with data:', receiptData);
        console.log('Current form values before update:', form.getValues());
        
        if (receiptData.merchant) {
          console.log('Setting merchant name:', receiptData.merchant);
          form.setValue("name", receiptData.merchant);
          filledFields.add("name");
          form.trigger("name");
        }
        
        if (receiptData.amount) {
          console.log('Setting amount:', receiptData.amount);
          form.setValue("amount", receiptData.amount);
          filledFields.add("amount");
          form.trigger("amount");
        }
        
        if (receiptData.date) {
          console.log('Setting date:', receiptData.date);
          form.setValue("date", new Date(receiptData.date));
          filledFields.add("date");
          form.trigger("date");
        }
        
        console.log('Auto-filled fields:', Array.from(filledFields));
        console.log('Form values after update:', form.getValues());
        setAutoFilledFields(filledFields);

        setTestResults({
          success: true,
          data: receiptData,
          message: 'Receipt processing and form updates successful!',
          filledFields: Array.from(filledFields)
        });
      } else {
        setError(result.error || 'Failed to process receipt');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Test error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    alert(`Form submitted successfully!\nName: ${data.name}\nAmount: ${data.amount}\nDate: ${data.date.toDateString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔧 Form Field Update Test
          </h1>
          <p className="text-xl text-gray-600">
            Test if receipt processing and form field updates are working correctly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Test Form
              </CardTitle>
              <CardDescription>
                This form simulates the transaction form to test field updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Merchant Name</Label>
                  <Input 
                    id="name"
                    {...form.register("name")}
                    className={autoFilledFields.has('name') ? 'bg-green-50 border-green-200' : ''}
                    placeholder="e.g., Starbucks"
                  />
                  {autoFilledFields.has('name') && (
                    <p className="text-xs text-green-600 mt-1">🤖 Auto-filled by OCR</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register("amount", { valueAsNumber: true })}
                    className={autoFilledFields.has('amount') ? 'bg-green-50 border-green-200' : ''}
                    placeholder="0.00"
                  />
                  {autoFilledFields.has('amount') && (
                    <p className="text-xs text-green-600 mt-1">🤖 Auto-filled by OCR</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date"
                    type="date"
                    {...form.register("date", { valueAsDate: true })}
                    className={autoFilledFields.has('date') ? 'bg-green-50 border-green-200' : ''}
                  />
                  {autoFilledFields.has('date') && (
                    <p className="text-xs text-green-600 mt-1">🤖 Auto-filled by OCR</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button"
                    onClick={testReceiptProcessing}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isProcessing ? 'Processing...' : 'Test Receipt Processing'}
                  </Button>
                  
                  <Button type="submit" className="flex-1">
                    Submit Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Test Results
              </CardTitle>
              <CardDescription>
                View the results of your tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={testResults.success ? "default" : "destructive"}>
                      {testResults.success ? "✅ Success" : "❌ Failed"}
                    </Badge>
                    <Badge variant="outline">
                      {testResults.filledFields?.length || 0} fields filled
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    {testResults.message}
                  </div>

                  {testResults.data && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Extracted Data:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Merchant:</span>
                          <Badge variant="outline">
                            {testResults.data.merchant || 'Not found'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Amount:</span>
                          <Badge variant="outline">
                            ${testResults.data.amount || 'Not found'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Date:</span>
                          <Badge variant="outline">
                            {testResults.data.date || 'Not found'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Confidence:</span>
                          <Badge variant="outline">
                            {Math.round((testResults.data.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <strong>Debug Info:</strong> Check browser console for detailed logs
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No test results yet. Run a test to see the results!</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Test Receipt Processing</h3>
                <p className="text-sm text-gray-600">
                  Click "Test Receipt Processing" to simulate uploading a receipt and see if the form fields get auto-filled.
                  The fields should turn green and show "🤖 Auto-filled by OCR" if successful.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Check Form Values</h3>
                <p className="text-sm text-gray-600">
                  After the test, check if the form fields are actually filled with the extracted data.
                  You can also click "Submit Form" to see the final form values.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Check Browser Console</h3>
                <p className="text-sm text-gray-600">
                  Open your browser's developer console (F12) to see detailed logs of the processing.
                  Look for logs showing form values before and after updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
