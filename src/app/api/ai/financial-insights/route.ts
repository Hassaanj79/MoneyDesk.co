import { NextRequest, NextResponse } from 'next/server';
import { aiCache } from '@/lib/ai-cache';
import { openaiFinancialAnalysis, FinancialData } from '@/services/openai-financial-analysis';
import { groqFinancialAnalysis } from '@/services/groq-financial-analysis';

interface FinancialAggregates {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  topCategories: { name: string; amount: number }[];
  averageTransaction: number;
}

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

// Financial quotes for inspiration
const FINANCIAL_QUOTES = [
  "A penny saved is a penny earned.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Don't save what is left after spending; spend what is left after saving.",
  "It's not how much money you make, but how much money you keep.",
  "The habit of saving is itself an education; it fosters every virtue.",
  "Beware of little expenses; a small leak will sink a great ship.",
  "An investment in knowledge pays the best interest.",
  "The way to get started is to quit talking and begin doing.",
  "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
  "The goal isn't more money. The goal is living life on your terms."
];

export async function POST(request: NextRequest) {
  try {
    const { aggregates, dateRange, currency, userId = 'current-user', transactions = [], categories = [] } = await request.json();

    // Validate input
    if (!aggregates || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Generate transaction hash for cache invalidation
    const transactionHash = transactions.length > 0 
      ? transactions.map(t => `${t.id}-${t.amount}-${t.type}-${t.date}-${t.name}`).join('|')
      : 'no-transactions';
    
    // Also include aggregates in the hash to ensure cache invalidation when data changes
    const aggregatesHash = `${aggregates.totalIncome}-${aggregates.totalExpenses}-${aggregates.netIncome}-${aggregates.transactionCount}`;
    const fullHash = `${transactionHash}-${aggregatesHash}`;
    
    // Check cache first
    const cacheKey = aiCache.generateKey(userId, dateRange, currency, fullHash);
    const cachedInsights = aiCache.get(cacheKey);
    
    if (cachedInsights) {
      console.log('Returning cached AI insights');
      return NextResponse.json({
        ...cachedInsights,
        cached: true
      });
    }

        // Check if Groq API key is available (preferred - free)
        if (process.env.GROQ_API_KEY) {
          console.log('Using Groq for AI insights...');
          try {
            const financialData: FinancialData = {
              totalIncome: aggregates.totalIncome,
              totalExpense: aggregates.totalExpenses,
              netSavings: aggregates.netIncome,
              currency,
              dateRange,
              transactions: transactions.map((t: any) => ({
                type: t.type,
                amount: t.amount,
                category: t.categoryName || t.categoryId,
                name: t.name,
                date: t.date
              })),
              categories: categories.map((c: any) => ({
                name: c.name,
                totalAmount: c.totalAmount || 0,
                transactionCount: c.transactionCount || 0
              }))
            };

            const insights = await groqFinancialAnalysis.generateFinancialInsights(financialData);
            aiCache.set(cacheKey, insights, 30 * 1000); // Reduced to 30 seconds for more frequent updates
            return NextResponse.json({
              ...insights,
              aiPowered: true,
              provider: 'groq'
            });
          } catch (groqError) {
            console.error('Groq error, falling back to rule-based insights:', groqError);
            // Fall through to rule-based insights
          }
        }

        // Check if OpenAI API key is available (fallback)
        if (process.env.OPENAI_API_KEY) {
          console.log('Using OpenAI for AI insights...');
          try {
            const financialData: FinancialData = {
              totalIncome: aggregates.totalIncome,
              totalExpense: aggregates.totalExpenses,
              netSavings: aggregates.netIncome,
              currency,
              dateRange,
              transactions: transactions.map((t: any) => ({
                type: t.type,
                amount: t.amount,
                category: t.categoryName || t.categoryId,
                name: t.name,
                date: t.date
              })),
              categories: categories.map((c: any) => ({
                name: c.name,
                totalAmount: c.totalAmount || 0,
                transactionCount: c.transactionCount || 0
              }))
            };

            const insights = await openaiFinancialAnalysis.generateFinancialInsights(financialData);
            aiCache.set(cacheKey, insights, 30 * 1000); // Reduced to 30 seconds for more frequent updates
            return NextResponse.json({
              ...insights,
              aiPowered: true,
              provider: 'openai'
            });
          } catch (openaiError: any) {
            console.error('OpenAI error, falling back to rule-based insights:', openaiError);
            
            // Check if it's a quota error and disable OpenAI temporarily
            if (openaiError?.code === 'insufficient_quota' || openaiError?.status === 429) {
              console.log('OpenAI quota exceeded, will use fallback insights');
            }
            // Fall through to rule-based insights
          }
        }

        // Fallback to rule-based insights
        console.log('No AI API keys found, using fallback insights');
        const insights = generateFinancialInsights(aggregates, dateRange, currency);
        return NextResponse.json({
          ...insights,
          fallback: true
        });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    
    // Always fallback to rule-based insights if anything fails
    try {
      // Re-parse the request to get the data for fallback
      const requestBody = await request.json();
      const { aggregates, dateRange, currency } = requestBody;
      
      if (aggregates && dateRange && currency) {
        const insights = generateFinancialInsights(aggregates, dateRange, currency);
        return NextResponse.json({
          ...insights,
          fallback: true,
          error: 'AI service unavailable, using fallback analysis'
        });
      } else {
        throw new Error('Invalid request data for fallback');
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json(
        { 
          error: 'Failed to generate insights',
          fallback: true,
          summary: 'Unable to generate financial insights at this time.',
          highlights: ['Please try again later'],
          recommendations: [{
            title: 'Try Again',
            description: 'Please refresh the page and try generating insights again.',
            priority: 'medium' as const
          }],
          quote: 'Persistence is the key to success.'
        },
        { status: 200 } // Return 200 to prevent UI errors
      );
    }
  }
}

function generateFinancialInsights(
  aggregates: FinancialAggregates,
  dateRange: { from: string; to: string },
  currency: string
): AIInsight {
  const { totalIncome, totalExpenses, netIncome, transactionCount, topCategories, averageTransaction } = aggregates;
  
  // Calculate date range duration
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateRangeStr = `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;

  // Generate summary
  const summary = generateSummary(aggregates, dateRangeStr, currency, daysDiff);

  // Generate highlights
  const highlights = generateHighlights(aggregates, currency, daysDiff);

  // Generate recommendations
  const recommendations = generateRecommendations(aggregates, currency);

  // Select random quote
  const quote = FINANCIAL_QUOTES[Math.floor(Math.random() * FINANCIAL_QUOTES.length)];

  return {
    summary,
    highlights,
    recommendations,
    quote
  };
}

function generateSummary(
  aggregates: FinancialAggregates,
  dateRangeStr: string,
  currency: string,
  daysDiff: number
): string {
  const { totalIncome, totalExpenses, netIncome, transactionCount } = aggregates;
  
  let summary = `During ${dateRangeStr}, you had ${currency}${totalIncome.toFixed(2)} in income and ${currency}${totalExpenses.toFixed(2)} in expenses`;
  
  if (netIncome > 0) {
    summary += `, resulting in a positive net income of ${currency}${netIncome.toFixed(2)}.`;
  } else if (netIncome < 0) {
    summary += `, resulting in a negative net income of ${currency}${Math.abs(netIncome).toFixed(2)}.`;
  } else {
    summary += `, breaking even with no net income.`;
  }

  if (daysDiff > 0) {
    const dailyAverage = (totalIncome + totalExpenses) / daysDiff;
    summary += ` Your daily average spending was ${currency}${dailyAverage.toFixed(2)}.`;
  }

  return summary;
}

function generateHighlights(
  aggregates: FinancialAggregates,
  currency: string,
  daysDiff: number
): string[] {
  const { totalIncome, totalExpenses, netIncome, transactionCount, topCategories, averageTransaction } = aggregates;
  const highlights: string[] = [];

  // Transaction count
  highlights.push(`Total of ${transactionCount} transactions processed`);

  // Top spending category
  if (topCategories.length > 0) {
    highlights.push(`Top spending category: ${topCategories[0].name} (${currency}${topCategories[0].amount.toFixed(2)})`);
  }

  // Average transaction
  highlights.push(`Average transaction: ${currency}${averageTransaction.toFixed(2)}`);

  // Cash flow status
  if (netIncome > 0) {
    highlights.push('Positive cash flow this period');
  } else if (netIncome < 0) {
    highlights.push('Negative cash flow this period');
  } else {
    highlights.push('Break-even this period');
  }

  // Daily spending if period is more than 1 day
  if (daysDiff > 1) {
    const dailySpending = totalExpenses / daysDiff;
    highlights.push(`Daily average spending: ${currency}${dailySpending.toFixed(2)}`);
  }

  return highlights.slice(0, 4); // Limit to 4 highlights
}

function generateRecommendations(
  aggregates: FinancialAggregates,
  currency: string
): Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> {
  const { totalIncome, totalExpenses, netIncome, topCategories, averageTransaction, transactionCount } = aggregates;
  const recommendations: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> = [];

  // Negative cash flow recommendation
  if (netIncome < 0) {
    const deficit = Math.abs(netIncome);
    recommendations.push({
      title: 'Address Negative Cash Flow',
      description: `You're spending ${currency}${deficit.toFixed(2)} more than you're earning. Review your expenses and identify areas to cut back.`,
      priority: 'high'
    });
  }

  // High spending category recommendation
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const percentage = (topCategory.amount / totalExpenses) * 100;
    
    if (percentage > 40) {
      recommendations.push({
        title: 'Set Budget for High Spending Category',
        description: `${topCategory.name} accounts for ${percentage.toFixed(1)}% of your expenses (${currency}${topCategory.amount.toFixed(2)}). This is unusually high and needs attention.`,
        priority: 'high'
      });
    } else if (percentage > 25) {
      recommendations.push({
        title: 'Monitor Top Spending Category',
        description: `${topCategory.name} is your highest expense at ${currency}${topCategory.amount.toFixed(2)} (${percentage.toFixed(1)}% of total). Consider setting a monthly limit.`,
        priority: 'medium'
      });
    }
  }

  // Savings optimization for positive cash flow
  if (netIncome > 0) {
    const savingsRate = (netIncome / totalIncome) * 100;
    if (savingsRate < 10) {
      recommendations.push({
        title: 'Increase Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income (${currency}${netIncome.toFixed(2)}). Aim for at least 20% to build wealth.`,
        priority: 'medium'
      });
    } else if (savingsRate > 20) {
      recommendations.push({
        title: 'Excellent Savings Rate!',
        description: `Outstanding! You're saving ${savingsRate.toFixed(1)}% of your income. Consider investing these savings for long-term growth.`,
        priority: 'low'
      });
    } else {
      recommendations.push({
        title: 'Good Savings Progress',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income. Consider increasing this to 20% for better financial security.`,
        priority: 'medium'
      });
    }
  }

  // Transaction frequency recommendations
  if (transactionCount > 100) {
    recommendations.push({
      title: 'Consolidate Small Transactions',
      description: `You made ${transactionCount} transactions this period. Consider batching small purchases to reduce fees and improve tracking.`,
      priority: 'medium'
    });
  } else if (transactionCount < 5 && totalExpenses > 0) {
    recommendations.push({
      title: 'Improve Transaction Tracking',
      description: 'You have very few recorded transactions. Make sure to log all expenses for accurate financial insights.',
      priority: 'medium'
    });
  }

  // High average transaction recommendation
  if (averageTransaction > 500) {
    recommendations.push({
      title: 'Review Large Transactions',
      description: `Your average transaction is ${currency}${averageTransaction.toFixed(2)}. Review if these large purchases align with your financial goals.`,
      priority: 'medium'
    });
  }

  // Default recommendations if none generated
  if (recommendations.length === 0) {
    recommendations.push(
      {
        title: 'Set Monthly Budget',
        description: 'Create a comprehensive monthly budget to track income and expenses effectively.',
        priority: 'medium'
      },
      {
        title: 'Review Spending Categories',
        description: 'Regularly review your spending categories to identify optimization opportunities.',
        priority: 'low'
      }
    );
  }

  return recommendations.slice(0, 4); // Limit to 4 recommendations
}
