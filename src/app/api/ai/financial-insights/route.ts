import { NextRequest, NextResponse } from 'next/server';
import { aiCache } from '@/lib/ai-cache';

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
    const { aggregates, dateRange, currency, userId = 'current-user' } = await request.json();

    // Validate input
    if (!aggregates || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = aiCache.generateKey(userId, dateRange, currency);
    const cachedInsights = aiCache.get(cacheKey);
    
    if (cachedInsights) {
      console.log('Returning cached AI insights');
      return NextResponse.json({
        ...cachedInsights,
        cached: true
      });
    }

    // Generate AI insights using rule-based logic (simulating AI)
    const insights = generateFinancialInsights(aggregates, dateRange, currency);

    // Cache the results for 5 minutes
    aiCache.set(cacheKey, insights, 5 * 60 * 1000);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating financial insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
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
