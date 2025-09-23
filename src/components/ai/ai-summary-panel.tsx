"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Copy, 
  RefreshCw, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  Quote,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDateRange } from '@/contexts/date-range-context';
import { useTransactions } from '@/contexts/transaction-context';
import { useCategories } from '@/contexts/category-context';
import { useAccounts } from '@/contexts/account-context';
import { useCurrencyContext } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIInsight {
  summary: string;
  highlights: string[];
  recommendations: {
    title: string;
    description: string;
    action?: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  quote: string;
}

interface AISummaryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISummaryPanel({ open, onOpenChange }: AISummaryPanelProps) {
  const { date } = useDateRange();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { currency } = useCurrencyContext();
  const { user } = useAuth();
  
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  // Filter transactions for the selected date range
  const filteredTransactions = React.useMemo(() => {
    if (!date.from || !date.to) return [];
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= date.from! && transactionDate <= date.to!;
    });
  }, [transactions, date]);

  // Check AI privacy setting
  useEffect(() => {
    if (user?.uid) {
      const savedPreference = localStorage.getItem(`ai-enabled-${user.uid}`);
      setAiEnabled(savedPreference === 'true');
    }
  }, [user?.uid]);

  // Generate insights when panel opens or date range changes
  useEffect(() => {
    if (open && filteredTransactions.length > 0 && aiEnabled) {
      generateInsights();
    }
  }, [open, date.from, date.to, aiEnabled]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate financial aggregates
      const aggregates = calculateAggregates(filteredTransactions, categories);
      
      // Call AI API endpoint
      const response = await fetch('/api/ai/financial-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregates,
          dateRange: {
            from: date.from?.toISOString(),
            to: date.to?.toISOString(),
          },
          currency: currency,
          userId: user?.uid || 'anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
      // Fallback to rule-based insights
      setInsights(generateFallbackInsights());
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregates = (transactions: any[], categories: any[]) => {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, transaction) => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
    
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      transactionCount: transactions.length,
      topCategories,
      averageTransaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0,
    };
  };

  const generateFallbackInsights = (): AIInsight => {
    const aggregates = calculateAggregates(filteredTransactions, categories);
    const dateRangeStr = `${date.from?.toLocaleDateString()} - ${date.to?.toLocaleDateString()}`;
    
    return {
      summary: `During ${dateRangeStr}, you had ${currency}${aggregates.totalIncome.toFixed(2)} in income and ${currency}${aggregates.totalExpenses.toFixed(2)} in expenses, resulting in a ${aggregates.netIncome >= 0 ? 'positive' : 'negative'} net income of ${currency}${Math.abs(aggregates.netIncome).toFixed(2)}.`,
      highlights: [
        `Total of ${aggregates.transactionCount} transactions processed`,
        `Top spending category: ${aggregates.topCategories[0]?.name || 'N/A'}`,
        `Average transaction: ${currency}${aggregates.averageTransaction.toFixed(2)}`,
        aggregates.netIncome >= 0 ? 'Positive cash flow this period' : 'Negative cash flow this period'
      ],
      recommendations: [
        {
          title: 'Review Top Categories',
          description: `Consider setting a budget for ${aggregates.topCategories[0]?.name || 'your highest spending category'}.`,
          priority: 'medium' as const
        },
        {
          title: 'Track Spending Patterns',
          description: 'Monitor your spending trends to identify areas for improvement.',
          priority: 'low' as const
        }
      ],
      quote: 'A penny saved is a penny earned.'
    };
  };

  const copyToClipboard = async () => {
    if (!insights) return;
    
    const text = `${insights.summary}\n\nHighlights:\n${insights.highlights.map(h => `• ${h}`).join('\n')}\n\nRecommendations:\n${insights.recommendations.map(r => `• ${r.title}: ${r.description}`).join('\n')}\n\n"${insights.quote}"`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Insights copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const saveAsNote = async () => {
    if (!insights) return;
    
    try {
      const response = await fetch('/api/financial-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `AI Summary - ${date.from?.toLocaleDateString()} to ${date.to?.toLocaleDateString()}`,
          content: insights,
          dateRange: {
            from: date.from?.toISOString(),
            to: date.to?.toISOString(),
          },
        }),
      });

      if (response.ok) {
        toast.success('Summary saved as note');
      } else {
        throw new Error('Failed to save note');
      }
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle>AI Financial Summary</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateInsights}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Generating insights...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : !aiEnabled ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                AI Features Disabled
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Enable AI summaries in Settings to get personalized financial insights.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/settings'}
              >
                Go to Settings
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No activity found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No transactions found in this period. Try a wider date range.
              </p>
            </div>
          ) : insights ? (
            <>
              {/* Summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">Summary</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {insights.summary}
                </p>
              </div>

              <Separator />

              {/* Highlights */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold">Key Highlights</h3>
                </div>
                <div className="space-y-2">
                  {insights.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-semibold">Recommendations</h3>
                </div>
                <div className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{rec.title}</h4>
                              <Badge 
                                variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Quote */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold">Daily Inspiration</h3>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-l-purple-500">
                  <p className="text-sm italic text-purple-800 dark:text-purple-200">
                    "{insights.quote}"
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveAsNote}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Note
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
