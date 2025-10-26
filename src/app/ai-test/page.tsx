"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';

export default function AITestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testInput, setTestInput] = useState({
    transactionName: 'Starbucks Coffee',
    amount: 5.50,
    receiptText: 'STARBUCKS COFFEE\nGrande Latte $4.50\nTax $0.50\nTotal $5.00\nDate: 2024-01-15'
  });

  const testAPI = async (action: string, data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      
      const result = await response.json();
      setTestResults({ action, result });
    } catch (error: any) {
      setTestResults({ action, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Firebase AI Logic Test Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Test your Gemini AI features powered by Firebase AI Logic
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Test Inputs
              </CardTitle>
              <CardDescription>
                Configure your test data and run AI experiments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transactionName">Transaction Name</Label>
                <Input
                  id="transactionName"
                  value={testInput.transactionName}
                  onChange={(e) => setTestInput(prev => ({ ...prev, transactionName: e.target.value }))}
                  placeholder="e.g., Starbucks Coffee"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={testInput.amount}
                  onChange={(e) => setTestInput(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  placeholder="5.50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="receiptText">Receipt Text</Label>
                <Textarea
                  id="receiptText"
                  value={testInput.receiptText}
                  onChange={(e) => setTestInput(prev => ({ ...prev, receiptText: e.target.value }))}
                  placeholder="Enter receipt text..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => testAPI('receipt-parsing', { receiptText: testInput.receiptText })}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🧾 Parse Receipt'}
                </Button>
                <Button 
                  onClick={() => testAPI('category-suggestions', { 
                    transactionName: testInput.transactionName, 
                    amount: testInput.amount,
                    existingCategories: ['Food & Dining', 'Shopping', 'Entertainment', 'Transportation']
                  })}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🏷️ Get Categories'}
                </Button>
                <Button 
                  onClick={() => testAPI('spending-analysis', { 
                    transactions: [
                      { name: testInput.transactionName, amount: testInput.amount, category: 'Food & Dining', date: '2024-01-15' },
                      { name: 'Grocery Store', amount: 85.30, category: 'Food & Dining', date: '2024-01-14' },
                      { name: 'Gas Station', amount: 45.00, category: 'Transportation', date: '2024-01-13' }
                    ],
                    timeRange: 'last 30 days'
                  })}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '📊 Analyze Spending'}
                </Button>
                <Button 
                  onClick={() => testAPI('duplicate-detection', { 
                    newTransaction: { name: testInput.transactionName, amount: testInput.amount, date: '2024-01-15' },
                    existingTransactions: [
                      { name: 'Starbucks Coffee', amount: 5.50, date: '2024-01-14' },
                      { name: 'Grocery Store', amount: 85.30, date: '2024-01-13' }
                    ]
                  })}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🔍 Detect Duplicates'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                AI Results
              </CardTitle>
              <CardDescription>
                View the AI-powered analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {testResults.action.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(testResults, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No test results yet. Run a test to see AI insights!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-green-800">Firebase AI Logic</div>
                <div className="text-xs text-green-600">Active</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">🤖</div>
                <div className="text-sm text-green-800">Gemini 2.5 Flash</div>
                <div className="text-xs text-green-600">Ready</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">⚠️</div>
                <div className="text-sm text-yellow-800">Vision API</div>
                <div className="text-xs text-yellow-600">Optional</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
