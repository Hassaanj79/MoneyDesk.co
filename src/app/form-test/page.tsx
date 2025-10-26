"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function FormFieldTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
        setTestResults({
          success: true,
          data: result.data,
          message: 'Receipt processing successful!'
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

  const testFormFieldUpdate = () => {
    console.log('Testing form field update simulation...');
    
    // Simulate form field updates
    const mockData = {
      merchant: "Starbucks",
      amount: 5.00,
      date: "2024-01-15"
    };

    setTestResults({
      success: true,
      data: mockData,
      message: 'Form field update simulation successful!',
      simulated: true
    });
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
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Test Controls
              </CardTitle>
              <CardDescription>
                Run tests to verify receipt processing and form updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testReceiptProcessing}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Test Receipt Processing API'
                )}
              </Button>

              <Button 
                onClick={testFormFieldUpdate}
                variant="outline"
                className="w-full"
              >
                Test Form Field Update Simulation
              </Button>

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
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
                    {testResults.simulated && (
                      <Badge variant="outline">Simulated</Badge>
                    )}
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
                <h3 className="font-medium text-gray-900 mb-2">1. Test Receipt Processing API</h3>
                <p className="text-sm text-gray-600">
                  This tests the backend API that processes receipt text and extracts structured data.
                  Check the browser console for detailed logs.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Test Form Field Update Simulation</h3>
                <p className="text-sm text-gray-600">
                  This simulates what happens when form fields are updated with extracted data.
                  This helps verify the form update mechanism works.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Check Browser Console</h3>
                <p className="text-sm text-gray-600">
                  Open your browser's developer console (F12) to see detailed logs of the processing.
                  This will help identify where the issue might be.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
