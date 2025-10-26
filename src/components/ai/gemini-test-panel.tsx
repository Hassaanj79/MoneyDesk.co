"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAIFeatures } from '@/hooks/use-ai-features';

export function GeminiAITestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testInput, setTestInput] = useState({
    transactionName: 'Starbucks Coffee',
    amount: 5.50,
    receiptText: 'STARBUCKS COFFEE\nGrande Latte $4.50\nTax $0.50\nTotal $5.00\nDate: 2024-01-15'
  });

  const { 
    geminiAvailable, 
    getGeminiCategorySuggestions, 
    generateGeminiSpendingAnalysis,
    detectGeminiDuplicates 
  } = useAIFeatures();

  const testCategorySuggestions = async () => {
    setIsLoading(true);
    try {
      const suggestions = await getGeminiCategorySuggestions(
        testInput.transactionName, 
        testInput.amount
      );
      setTestResults({ type: 'category-suggestions', data: suggestions });
    } catch (error: any) {
      setTestResults({ type: 'error', error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testReceiptParsing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receipt-parsing',
          data: { receiptText: testInput.receiptText }
        })
      });
      
      const result = await response.json();
      setTestResults({ type: 'receipt-parsing', data: result.data });
    } catch (error: any) {
      setTestResults({ type: 'error', error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testSpendingAnalysis = async () => {
    setIsLoading(true);
    try {
      const mockTransactions = [
        { name: 'Starbucks Coffee', amount: 5.50, category: 'Food & Dining', date: '2024-01-15' },
        { name: 'Grocery Store', amount: 85.30, category: 'Food & Dining', date: '2024-01-14' },
        { name: 'Gas Station', amount: 45.00, category: 'Transportation', date: '2024-01-13' },
        { name: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2024-01-12' }
      ];

      const analysis = await generateGeminiSpendingAnalysis(mockTransactions);
      setTestResults({ type: 'spending-analysis', data: analysis });
    } catch (error: any) {
      setTestResults({ type: 'error', error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testDuplicateDetection = async () => {
    setIsLoading(true);
    try {
      const mockTransactions = [
        { name: 'Starbucks Coffee', amount: 5.50, category: 'Food & Dining', date: '2024-01-15' },
        { name: 'Grocery Store', amount: 85.30, category: 'Food & Dining', date: '2024-01-14' }
      ];

      const result = await detectGeminiDuplicates(
        { name: 'Starbucks Coffee', amount: 5.50, category: 'Food & Dining', date: new Date('2024-01-15') },
        mockTransactions.map(t => ({ ...t, date: new Date(t.date) }))
      );
      setTestResults({ type: 'duplicate-detection', data: result });
    } catch (error: any) {
      setTestResults({ type: 'error', error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!geminiAvailable) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Firebase Gemini AI Not Available
          </CardTitle>
          <CardDescription>
            Firebase AI Logic SDK is not properly configured. Please check your setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To enable Gemini AI features:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Enable Firebase AI Logic in Firebase Console</li>
              <li>Enable Vertex AI API in Google Cloud Console</li>
              <li>Configure proper service account permissions</li>
              <li>Check your environment variables</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Firebase Gemini AI Test Panel
          </CardTitle>
          <CardDescription>
            Test the various AI features powered by Firebase Gemini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receiptText">Receipt Text (for parsing test)</Label>
            <Textarea
              id="receiptText"
              value={testInput.receiptText}
              onChange={(e) => setTestInput(prev => ({ ...prev, receiptText: e.target.value }))}
              placeholder="Enter receipt text..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={testCategorySuggestions} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Categories'}
            </Button>
            <Button 
              onClick={testReceiptParsing} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Receipt'}
            </Button>
            <Button 
              onClick={testSpendingAnalysis} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Analysis'}
            </Button>
            <Button 
              onClick={testDuplicateDetection} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Duplicates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {testResults.type === 'error' ? 'Error occurred' : `Results for ${testResults.type}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.type === 'error' ? (
              <div className="text-red-500">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{testResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.type === 'category-suggestions' && (
                  <div>
                    <h4 className="font-medium mb-2">Category Suggestions:</h4>
                    <div className="space-y-2">
                      {testResults.data.map((suggestion: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="secondary">{suggestion.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Confidence: {(suggestion.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm">{suggestion.reasoning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.type === 'receipt-parsing' && (
                  <div>
                    <h4 className="font-medium mb-2">Parsed Receipt Data:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Merchant:</strong> {testResults.data.merchant || 'N/A'}</div>
                      <div><strong>Amount:</strong> ${testResults.data.amount || 'N/A'}</div>
                      <div><strong>Date:</strong> {testResults.data.date || 'N/A'}</div>
                      <div><strong>Confidence:</strong> {(testResults.data.confidence * 100).toFixed(1)}%</div>
                    </div>
                    {testResults.data.items && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Items:</h5>
                        <div className="space-y-1">
                          {testResults.data.items.map((item: any, index: number) => (
                            <div key={index} className="text-sm">
                              {item.name}: ${item.price}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {testResults.type === 'spending-analysis' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Insights:</h4>
                      <ul className="text-sm space-y-1">
                        {testResults.data.insights.map((insight: string, index: number) => (
                          <li key={index}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="text-sm space-y-1">
                        {testResults.data.recommendations.map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {testResults.type === 'duplicate-detection' && (
                  <div>
                    <h4 className="font-medium mb-2">Duplicate Detection Result:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={testResults.data.isDuplicate ? "destructive" : "secondary"}>
                          {testResults.data.isDuplicate ? "Duplicate Found" : "No Duplicate"}
                        </Badge>
                        <span className="text-sm">
                          Confidence: {(testResults.data.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{testResults.data.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
