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
    action?: string;
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
  const { totalIncome, totalExpenses, netIncome, topCategories, averageTransaction } = aggregates;
  const recommendations: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> = [];

  // Negative cash flow recommendation
  if (netIncome < 0) {
    recommendations.push({
      title: 'Address Negative Cash Flow',
      description: `You're spending ${currency}${Math.abs(netIncome).toFixed(2)} more than you're earning. Consider reducing expenses or increasing income.`,
      priority: 'high'
    });
  }

  // Top category spending recommendation
  if (topCategories.length > 0 && topCategories[0].amount > totalExpenses * 0.3) {
    recommendations.push({
      title: 'Review High Spending Category',
      description: `${topCategories[0].name} represents ${((topCategories[0].amount / totalExpenses) * 100).toFixed(1)}% of your expenses. Consider setting a budget limit.`,
      priority: 'medium'
    });
  }

  // Savings recommendation for positive cash flow
  if (netIncome > 0) {
    recommendations.push({
      title: 'Optimize Savings',
      description: `You have ${currency}${netIncome.toFixed(2)} in surplus. Consider allocating this to savings or investments.`,
      priority: 'medium'
    });
  }

  // Transaction frequency recommendation
  if (aggregates.transactionCount > 50) {
    recommendations.push({
      title: 'Monitor Transaction Frequency',
      description: 'You have many transactions this period. Consider consolidating or reviewing recurring payments.',
      priority: 'low'
    });
  }

  // General budgeting recommendation
  if (recommendations.length < 3) {
    recommendations.push({
      title: 'Set Category Budgets',
      description: 'Create budget limits for your top spending categories to better control expenses.',
      priority: 'low'
    });
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}
