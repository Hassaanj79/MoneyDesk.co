"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, AlertCircle, Receipt } from 'lucide-react';

export default function SmartReceiptTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testReceipts, setTestReceipts] = useState([
    {
      name: 'Starbucks Lahore',
      text: 'STARBUCKS LAHORE\nGrande Latte $4.50\nTax $0.50\nTotal $5.00\nDate: 2024-01-15',
      expected: { merchant: 'STARBUCKS', amount: 5.00, category: 'Food & Dining' }
    },
    {
      name: 'McDonald\'s Downtown',
      text: 'MCDONALDS DOWNTOWN\nBig Mac Meal $8.99\nTax $0.90\nTotal $9.89\nDate: 2024-01-15',
      expected: { merchant: 'MCDONALDS', amount: 9.89, category: 'Food & Dining' }
    },
    {
      name: 'Amazon Online',
      text: 'AMAZON.COM\nWireless Mouse $25.99\nShipping $5.99\nTotal $31.98\nDate: 2024-01-15',
      expected: { merchant: 'AMAZON', amount: 31.98, category: 'Shopping' }
    },
    {
      name: 'Netflix Subscription',
      text: 'NETFLIX\nMonthly Subscription $15.99\nTotal $15.99\nDate: 2024-01-15',
      expected: { merchant: 'NETFLIX', amount: 15.99, category: 'Subscriptions' }
    }
  ]);

  const testReceipt = async (receiptText: string) => {
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Test receipt parsing
      const parseResponse = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receipt-parsing',
          data: { receiptText }
        }),
      });

      const parseResult = await parseResponse.json();
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse receipt');
      }

      const receiptData = parseResult.data;

      // Test category suggestion
      const categoryResponse = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'category-suggestions',
          data: {
            transactionName: receiptData.merchant,
            amount: receiptData.amount,
            existingCategories: ['Food & Dining', 'Shopping', 'Subscriptions', 'Entertainment', 'Transportation']
          }
        }),
      });

      const categoryResult = await categoryResponse.json();
      
      setResults({
        receiptData,
        categorySuggestion: categoryResult.success ? categoryResult.suggestions[0] : null,
        rawText: receiptText
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧠 Smart Receipt Processing Test
          </h1>
          <p className="text-xl text-gray-600">
            Test the improved AI that extracts clean merchant names, total amounts, and smart categories
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Receipts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Test Receipts
              </CardTitle>
              <CardDescription>
                Click to test different receipt formats and see smart processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testReceipts.map((receipt, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{receipt.name}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">Expected: {receipt.expected.merchant}</Badge>
                      <Badge variant="secondary">${receipt.expected.amount}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-mono whitespace-pre-line">
                    {receipt.text}
                  </p>
                  <Button 
                    onClick={() => testReceipt(receipt.text)}
                    disabled={isProcessing}
                    size="sm"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test Smart Processing'
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Smart Processing Results
              </CardTitle>
              <CardDescription>
                See how AI extracts clean data from receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600 py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing receipt with AI...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {results && (
                <div className="space-y-6">
                  {/* Receipt Data */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-800">📝 Extracted Receipt Data</h4>
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Merchant:</span>
                        <Badge variant="outline" className="bg-white">
                          {results.receiptData.merchant}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Amount:</span>
                        <Badge variant="outline" className="bg-white">
                          ${results.receiptData.amount}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Date:</span>
                        <Badge variant="outline" className="bg-white">
                          {results.receiptData.date}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Confidence:</span>
                        <Badge variant="outline" className="bg-white">
                          {Math.round(results.receiptData.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Category Suggestion */}
                  {results.categorySuggestion && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-800">🏷️ Smart Category Suggestion</h4>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Category:</span>
                          <Badge variant="outline" className="bg-white">
                            {results.categorySuggestion.category}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Confidence:</span>
                          <Badge variant="outline" className="bg-white">
                            {Math.round(results.categorySuggestion.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Reasoning:</strong> {results.categorySuggestion.reasoning}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw Text */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">📄 Raw Receipt Text</h4>
                    <Textarea
                      value={results.rawText}
                      readOnly
                      rows={4}
                      className="font-mono text-sm bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {!results && !isProcessing && !error && (
                <div className="text-center text-gray-500 py-8">
                  <p>Select a test receipt to see smart processing in action!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Smart Processing Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-medium mb-1">Clean Merchant Names</h3>
                <p className="text-sm text-gray-600">"Starbucks Lahore" → "Starbucks"</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-medium mb-1">Total Amount Only</h3>
                <p className="text-sm text-gray-600">Extracts final total, ignores items</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-medium mb-1">Smart Categories</h3>
                <p className="text-sm text-gray-600">AI determines category from merchant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
