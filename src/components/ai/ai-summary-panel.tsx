"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { NotesViewer } from './notes-viewer';
import { useDateRange } from '@/contexts/date-range-context';
import { useTransactions } from '@/contexts/transaction-context';
import { useCategories } from '@/contexts/category-context';
import { useAccounts } from '@/contexts/account-context';
import { useCurrencyContext } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

interface AIInsight {
  summary: string;
  highlights: string[];
  recommendations: {
    title: string;
    description: string;
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
  const { user, ensureValidToken } = useAuth();
  
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  // const [showNotesViewer, setShowNotesViewer] = useState(false);
  const [noteAlreadyExists, setNoteAlreadyExists] = useState(false);
  const lastGeneratedRef = useRef<string>('');

  // Helper function to safely convert date to Date object
  const getDate = (dateValue: any): Date => {
    if (typeof dateValue === 'string') {
      return parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore timestamp
      return dateValue.toDate();
    } else if (dateValue && typeof dateValue.toISOString === 'function') {
      return new Date(dateValue.toISOString());
    }
    return new Date(); // fallback
  };

  // Filter transactions for the selected date range
  const filteredTransactions = React.useMemo(() => {
    if (!date.from || !date.to) {
      console.log('AI Summary: No date range selected');
      return [];
    }
    
    console.log('AI Summary: Filtering transactions for date range:', {
      from: date.from,
      to: date.to,
      totalTransactions: transactions.length
    });
    
    const filtered = transactions.filter(transaction => {
      try {
        const transactionDate = getDate(transaction.date);
        const isInRange = transactionDate >= date.from! && transactionDate <= date.to!;
        console.log('Transaction date check:', {
          transactionDate,
          isInRange,
          originalDate: transaction.date
        });
        return isInRange;
      } catch (error) {
        console.warn('Error parsing transaction date:', transaction.date, error);
        return false;
      }
    });
    
    console.log('AI Summary: Filtered transactions count:', filtered.length);
    return filtered;
  }, [transactions, date]);

  // Check AI privacy setting
  useEffect(() => {
    if (user?.uid) {
      const savedPreference = localStorage.getItem(`ai-enabled-${user.uid}`);
      setAiEnabled(savedPreference === 'true');
    }
  }, [user?.uid]);

  const generateInsights = useCallback(async () => {
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
          transactions: filteredTransactions,
          categories: categories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI insights API error:', errorData);
        throw new Error(`Failed to generate insights: ${errorData.error || response.statusText}`);
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
  }, [filteredTransactions, categories, date.from, date.to, currency, user?.uid]);

  // Generate insights when panel opens or date range changes
  useEffect(() => {
    if (open && filteredTransactions.length > 0 && aiEnabled) {
      // Create a unique key for this generation request
      const generationKey = `${date.from?.toISOString()}-${date.to?.toISOString()}-${filteredTransactions.length}-${user?.uid}`;
      
      // Only generate if we haven't already generated for this exact combination
      if (lastGeneratedRef.current !== generationKey) {
        lastGeneratedRef.current = generationKey;
        generateInsights();
      }
    }
  }, [open, filteredTransactions.length, aiEnabled, date.from, date.to, user?.uid]);

  // Check for existing notes when date range or insights change
  useEffect(() => {
    if (insights && date.from && date.to && user?.uid) {
      const noteData = {
        userId: user.uid,
        dateRange: {
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        },
      };
      const existingNote = checkForDuplicateNote(noteData);
      setNoteAlreadyExists(!!existingNote);
    } else {
      setNoteAlreadyExists(false);
    }
  }, [insights, date.from, date.to, user?.uid]);

  const calculateAggregates = useCallback((transactions: any[], categories: any[]) => {
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
      .sort(([,a], [,b]) => (b as number) - (a as number))
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
  }, []);

  const generateFallbackInsights = useCallback((): AIInsight => {
    const aggregates = calculateAggregates(filteredTransactions, categories);
    const dateRangeStr = `${date.from?.toLocaleDateString()} - ${date.to?.toLocaleDateString()}`;
    
    // Generate actionable recommendations based on data
    const recommendations = generateActionableRecommendations(aggregates, categories);
    
    return {
      summary: `During ${dateRangeStr}, you had ${currency}${aggregates.totalIncome.toFixed(2)} in income and ${currency}${aggregates.totalExpenses.toFixed(2)} in expenses, resulting in a ${aggregates.netIncome >= 0 ? 'positive' : 'negative'} net income of ${currency}${Math.abs(aggregates.netIncome).toFixed(2)}.`,
      highlights: [
        `Total of ${aggregates.transactionCount} transactions processed`,
        `Top spending category: ${aggregates.topCategories[0]?.name || 'N/A'} (${currency}${(aggregates.topCategories[0]?.amount as number || 0).toFixed(2)})`,
        `Average transaction: ${currency}${(aggregates.averageTransaction as number).toFixed(2)}`,
        aggregates.netIncome >= 0 ? 'Positive cash flow this period' : 'Negative cash flow this period'
      ],
      recommendations,
      quote: getInspirationalQuote(aggregates.netIncome)
    };
  }, [filteredTransactions, categories, date.from, date.to, currency]);

  const generateActionableRecommendations = (aggregates: any, categories: any[]) => {
    const recommendations = [];
    
    // High spending category recommendation
    if (aggregates.topCategories[0]) {
      const topCategory = aggregates.topCategories[0];
      const categoryAmount = topCategory.amount;
      const totalExpenses = aggregates.totalExpenses;
      const percentage = (categoryAmount / totalExpenses) * 100;
      
      if (percentage > 30) {
        recommendations.push({
          title: 'Set Budget for High Spending Category',
          description: `${topCategory.name} accounts for ${percentage.toFixed(1)}% of your expenses (${currency}${categoryAmount.toFixed(2)}). Set a monthly budget limit to control this spending.`,
          priority: 'high' as const
        });
      } else if (percentage > 20) {
        recommendations.push({
          title: 'Monitor Top Spending Category',
          description: `${topCategory.name} is your highest expense at ${currency}${categoryAmount.toFixed(2)}. Consider if this spending aligns with your financial goals.`,
          priority: 'medium' as const
        });
      }
    }
    
    // Negative cash flow recommendation
    if (aggregates.netIncome < 0) {
      const deficit = Math.abs(aggregates.netIncome);
      recommendations.push({
        title: 'Address Negative Cash Flow',
        description: `You spent ${currency}${deficit.toFixed(2)} more than you earned. Review your expenses and consider reducing non-essential spending.`,
        priority: 'high' as const
      });
    }
    
    // High transaction count recommendation
    if (aggregates.transactionCount > 50) {
      recommendations.push({
        title: 'Consolidate Small Transactions',
        description: `You made ${aggregates.transactionCount} transactions this period. Consider batching small purchases to reduce transaction fees and better track spending.`,
        priority: 'medium' as const
      });
    }
    
    // Low transaction count recommendation
    if (aggregates.transactionCount < 5 && aggregates.totalExpenses > 0) {
      recommendations.push({
        title: 'Improve Transaction Tracking',
        description: 'You have few recorded transactions. Make sure to log all expenses to get accurate financial insights.',
        priority: 'medium' as const
      });
    }
    
    // Savings opportunity
    if (aggregates.netIncome > 0) {
      const savingsRate = (aggregates.netIncome / aggregates.totalIncome) * 100;
      if (savingsRate < 10) {
        recommendations.push({
          title: 'Increase Savings Rate',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income. Aim for at least 20% to build a strong financial foundation.`,
          priority: 'medium' as const
        });
      } else if (savingsRate > 20) {
        recommendations.push({
          title: 'Great Savings Rate!',
          description: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income. Consider investing these savings for long-term growth.`,
          priority: 'low' as const
        });
      }
    }
    
    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push(
        {
          title: 'Set Monthly Budget',
          description: 'Create a monthly budget to track your income and expenses more effectively.',
          priority: 'medium' as const
        },
        {
          title: 'Review Spending Categories',
          description: 'Regularly review your spending categories to identify areas for optimization.',
          priority: 'low' as const
        }
      );
    }
    
    return recommendations.slice(0, 4); // Limit to 4 recommendations
  };

  const getInspirationalQuote = (netIncome: number) => {
    const quotes = [
      "The best time to plant a tree was 20 years ago. The second best time is now.",
      "A budget is telling your money where to go instead of wondering where it went.",
      "It's not how much money you make, but how much money you keep.",
      "The habit of saving is itself an education; it fosters every virtue.",
      "Do not save what is left after spending, but spend what is left after saving.",
      "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
      "The goal isn't more money. The goal is living life on your terms.",
      "Small amounts saved daily add up to huge investments in the end."
    ];
    
    // Return different quotes based on financial situation
    if (netIncome < 0) {
      return quotes[1]; // Budget quote
    } else if (netIncome > 0) {
      return quotes[4]; // Saving quote
    } else {
      return quotes[0]; // General motivational quote
    }
  };

  const handleAIToggle = (enabled: boolean) => {
    if (user?.uid) {
      localStorage.setItem(`ai-enabled-${user.uid}`, enabled.toString());
      setAiEnabled(enabled);
      
      if (enabled) {
        toast.success('AI features enabled! Generating insights...');
        // Generate insights immediately after enabling
        setTimeout(() => {
          generateInsights();
        }, 500);
      } else {
        toast.info('AI features disabled');
      }
    }
  };


  const copyToClipboard = async () => {
    if (!insights) return;
    
    const text = `${insights.summary}\n\nHighlights:\n${insights.highlights.map(h => `• ${typeof h === 'string' ? h : h.title || h.description || JSON.stringify(h)}`).join('\n')}\n\nRecommendations:\n${insights.recommendations.map(r => `• ${r.title}: ${r.description}`).join('\n')}\n\n"${insights.quote}"`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Insights copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const checkForDuplicateNote = (noteData: any) => {
    try {
      const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
      
      // Check if a note with the same date range and user already exists
      const duplicate = localNotes.find((note: any) => 
        note.userId === noteData.userId &&
        note.dateRange.from === noteData.dateRange.from &&
        note.dateRange.to === noteData.dateRange.to
      );
      
      return duplicate;
    } catch (error) {
      console.error('Error checking for duplicate notes:', error);
      return null;
    }
  };

  const saveAsNote = async () => {
    if (!insights) return;
    
    const noteData = {
      title: `AI Summary - ${date.from?.toLocaleDateString()} to ${date.to?.toLocaleDateString()}`,
      content: insights,
      dateRange: {
        from: date.from?.toISOString(),
        to: date.to?.toISOString(),
      },
      userId: user?.uid || 'anonymous'
    };

    // Check for duplicate notes
    const existingNote = checkForDuplicateNote(noteData);
    if (existingNote) {
      toast.error('A note for this date range already exists. Please choose a different date range or delete the existing note first.');
      return;
    }

    try {
      // Ensure we have a valid token before making the request
      await ensureValidToken();

      const response = await fetch('/api/financial-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.local) {
          // Save to localStorage as fallback
          const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
          localNotes.push({
            id: result.id,
            ...noteData,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('financial-notes', JSON.stringify(localNotes));
          toast.success('Summary saved locally');
          setNoteAlreadyExists(true);
        } else {
          toast.success('Summary saved as note');
          setNoteAlreadyExists(true);
        }
      } else {
        throw new Error('Failed to save note');
      }
    } catch (err) {
      // Fallback to localStorage
      try {
        const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
        localNotes.push({
          id: `local-${Date.now()}`,
          ...noteData,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('financial-notes', JSON.stringify(localNotes));
        toast.success('Summary saved locally');
        setNoteAlreadyExists(true);
      } catch (localErr) {
        console.error('Failed to save locally:', localErr);
        toast.error('Failed to save note');
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle>Financial Analysis</CardTitle>
          </div>
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotesViewer(true)}
                    className="h-8 w-8 p-0"
                  >
                    <FileText className="h-4 w-4" />
                  </Button> */}
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <p>View Notes</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateInsights}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <p>Refresh Analysis</p>
                </TooltipContent>
              </Tooltip>
              
              {insights && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center">
                      <p>Copy to Clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={saveAsNote}
                        disabled={noteAlreadyExists}
                        className={cn("h-8 w-8 p-0", noteAlreadyExists && "opacity-50 cursor-not-allowed")}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center">
                      <p>{noteAlreadyExists ? "Already Saved" : "Save as Note"}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Enable AI summaries to get personalized financial insights and recommendations.
              </p>
              
              {/* AI Toggle Switch */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Label htmlFor="ai-toggle" className="text-sm font-medium">
                  Enable AI Summaries
                </Label>
                <Switch
                  id="ai-toggle"
                  checked={aiEnabled}
                  onCheckedChange={handleAIToggle}
                />
              </div>
              
              <div className="text-xs text-gray-400 dark:text-gray-500">
                You can also manage this setting in{' '}
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="underline hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Settings
                </button>
              </div>
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
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {insights.summary.split('\n').map((line, index) => (
                    <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
                      {line.trim() === '' ? null : line}
                    </div>
                  ))}
                </div>
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
                        {typeof highlight === 'string' ? highlight : highlight.title || highlight.description || JSON.stringify(highlight)}
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
                  <h3 className="font-semibold">Tip of the Day</h3>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-l-purple-500">
                  <p className="text-sm italic text-purple-800 dark:text-purple-200">
                    "{insights.quote}"
                  </p>
                </div>
              </div>

            </>
          ) : null}
          
          {/* AI Disclaimer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bot className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">AI-Generated Content</p>
                <p>
                  This financial analysis is generated by artificial intelligence and may contain errors or inaccuracies. 
                  Please consult with a qualified accountant or financial advisor before making any financial decisions 
                  based on this information.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Notes Viewer */}
      {/* <NotesViewer 
        isOpen={showNotesViewer} 
        onClose={() => setShowNotesViewer(false)} 
      /> */}
    </div>
  );
}
