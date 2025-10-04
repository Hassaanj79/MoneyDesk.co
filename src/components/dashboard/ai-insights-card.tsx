"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { useTransactions } from '@/contexts/transaction-context';
import { useDateRange } from '@/contexts/date-range-context';
import { useAIFeatures } from '@/hooks/use-ai-features';
import { cn } from '@/lib/utils';

interface AIInsight {
  type: 'spending_pattern' | 'budget_warning' | 'anomaly' | 'trend';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export function AIInsightsCard() {
  const { transactions } = useTransactions();
  const { date } = useDateRange();
  const aiFeatures = useAIFeatures();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter transactions for the current date range
  const filteredTransactions = transactions.filter(transaction => {
    if (!date?.from || !date?.to) return false;
    const transactionDate = new Date(transaction.date);
    return transactionDate >= date.from && transactionDate <= date.to;
  });

  const generateInsights = async () => {
    if (filteredTransactions.length === 0) return;
    
    setLoading(true);
    try {
      const spendingInsights = aiFeatures.generateSpendingInsights(filteredTransactions);
      setInsights(spendingInsights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      generateInsights();
    }
  }, [filteredTransactions.length, date?.from, date?.to]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return <TrendingUp className="h-4 w-4" />;
      case 'budget_warning': return <AlertTriangle className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <TrendingDown className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (filteredTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateInsights}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Smart analysis of your spending patterns and financial trends
        </CardDescription>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Analyzing your data...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No insights available for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50/50"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {insight.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
