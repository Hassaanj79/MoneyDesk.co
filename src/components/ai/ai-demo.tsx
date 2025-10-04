"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAIFeatures } from '@/hooks/use-ai-features';
import { Transaction } from '@/types';
import { Bot, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

export function AIDemo() {
  const {
    categorizeTransaction,
    getCategorizationConfidence,
    suggestCategories,
    detectDuplicate,
    generateSpendingInsights,
    notifications,
    unreadCount
  } = useAIFeatures();

  const [testTransaction, setTestTransaction] = useState({
    name: 'Starbucks Coffee',
    amount: 5.50,
    type: 'expense' as const
  });

  const [categorizationResult, setCategorizationResult] = useState<{
    category: string | null;
    confidence: number;
    suggestions: Array<{category: string, confidence: number}>;
  } | null>(null);

  const [duplicateResult, setDuplicateResult] = useState<boolean | null>(null);

  const handleTestCategorization = () => {
    try {
      const category = categorizeTransaction(testTransaction);
      const confidence = getCategorizationConfidence(testTransaction);
      const suggestions = suggestCategories(testTransaction);
      
      setCategorizationResult({
        category,
        confidence,
        suggestions
      });
    } catch (error) {
      console.error('Error testing categorization:', error);
      setCategorizationResult({
        category: null,
        confidence: 0,
        suggestions: []
      });
    }
  };

  const handleTestDuplicate = () => {
    try {
      // Create some mock existing transactions
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId: 'test',
          name: 'Starbucks Coffee',
          amount: 5.50,
          type: 'expense',
          category: 'Food & Dining',
          accountId: 'test-account',
          date: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'test',
          name: 'Amazon Purchase',
          amount: 25.99,
          type: 'expense',
          category: 'Shopping',
          accountId: 'test-account',
          date: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const isDuplicate = detectDuplicate(testTransaction, mockTransactions);
      setDuplicateResult(isDuplicate);
    } catch (error) {
      console.error('Error testing duplicate detection:', error);
      setDuplicateResult(false);
    }
  };

  const handleGenerateInsights = () => {
    try {
      generateSpendingInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AI Features Demo</h2>
        <p className="text-muted-foreground">
          Test the AI-powered features of MoneyDesk.co
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Categorization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Smart Categorization
            </CardTitle>
            <CardDescription>
              AI automatically categorizes your transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-name">Transaction Name</Label>
              <Input
                id="transaction-name"
                value={testTransaction.name}
                onChange={(e) => setTestTransaction({...testTransaction, name: e.target.value})}
                placeholder="e.g., Starbucks Coffee"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Amount</Label>
              <Input
                id="transaction-amount"
                type="number"
                value={testTransaction.amount}
                onChange={(e) => setTestTransaction({...testTransaction, amount: parseFloat(e.target.value)})}
                placeholder="5.50"
              />
            </div>
            <Button onClick={handleTestCategorization} className="w-full">
              Test Categorization
            </Button>
            
            {categorizationResult && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Category:</span>
                  <Badge variant="secondary">
                    {categorizationResult.category || 'Not detected'}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(categorizationResult.confidence * 100)}% confidence
                  </Badge>
                </div>
                {categorizationResult.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {categorizationResult.suggestions.map((suggestion, index) => (
                        <Badge key={index} variant="outline">
                          {suggestion.category} ({Math.round(suggestion.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duplicate Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Duplicate Detection
            </CardTitle>
            <CardDescription>
              AI detects potential duplicate transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test if your transaction might be a duplicate based on existing transactions.
            </p>
            <Button onClick={handleTestDuplicate} className="w-full">
              Test Duplicate Detection
            </Button>
            
            {duplicateResult !== null && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {duplicateResult ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-yellow-700">Potential Duplicate Detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-700">No Duplicate Found</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Spending Insights
            </CardTitle>
            <CardDescription>
              AI analyzes your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate AI-powered insights about your spending habits and patterns.
            </p>
            <Button onClick={handleGenerateInsights} className="w-full">
              Generate Insights
            </Button>
            <p className="text-xs text-muted-foreground">
              Check the console for generated insights
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Smart Notifications
            </CardTitle>
            <CardDescription>
              AI-powered notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Unread Notifications:</span>
              <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
                {unreadCount}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Smart notifications appear in the header bell icon. They provide insights about your spending, budget warnings, and financial tips.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Transactions for Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Transactions for Testing</CardTitle>
          <CardDescription>
            Try these sample transactions to test the AI features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Starbucks Coffee', amount: 5.50 },
              { name: 'Amazon Purchase', amount: 25.99 },
              { name: 'Uber Ride', amount: 12.75 },
              { name: 'Netflix Subscription', amount: 15.99 },
              { name: 'Shell Gas Station', amount: 45.00 },
              { name: 'McDonald\'s', amount: 8.50 }
            ].map((transaction, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => setTestTransaction({
                  ...transaction,
                  type: 'expense' as const
                })}
                className="justify-start"
              >
                {transaction.name} - ${transaction.amount}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
