import { NextRequest, NextResponse } from 'next/server';
import { aiCache } from '@/lib/ai-cache';
import { openaiFinancialAnalysis, FinancialData } from '@/services/openai-financial-analysis';
import { groqFinancialAnalysis } from '@/services/groq-financial-analysis';
import { firebaseGemini } from '@/services/firebase-gemini';

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

// Personal expense management tips
const EXPENSE_MANAGEMENT_TIPS = [
  "Track your daily coffee purchases - small expenses add up quickly over time.",
  "Use the 24-hour rule: wait a day before making non-essential purchases over $50.",
  "Set up automatic transfers to savings on payday before you see the money.",
  "Review your subscriptions monthly - cancel services you don't actively use.",
  "Create a 'fun money' budget category to avoid feeling restricted while staying on track.",
  "Use cash for discretionary spending to make purchases feel more real and limit overspending.",
  "Take photos of receipts instead of keeping paper copies - easier to organize and search.",
  "Set specific financial goals with deadlines to stay motivated and focused.",
  "Use price comparison apps before making major purchases to ensure you get the best deal.",
  "Implement the 'one in, one out' rule: for every new item you buy, donate or sell an old one.",
  "Track your spending patterns for 30 days to identify where your money actually goes.",
  "Set up separate savings accounts for different goals (emergency, vacation, etc.).",
  "Use budgeting apps that sync with your bank accounts for real-time tracking.",
  "Plan your meals weekly and stick to a grocery list to avoid impulse food purchases.",
  "Negotiate bills annually - many services offer discounts for loyal customers.",
  "Use the envelope method: allocate cash for different spending categories each month.",
  "Set up alerts for low account balances to avoid overdraft fees.",
  "Review your credit card statements monthly to catch unauthorized charges early.",
  "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt repayment.",
  "Create a 'no-spend' day once a week to build better spending habits."
];

export async function POST(request: NextRequest) {
  // Parse request body once at the beginning
  let requestData;
  try {
    requestData = await request.json();
  } catch (parseError) {
    console.error('Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }

  const { aggregates, dateRange, currency, userId = 'current-user', transactions = [], categories = [] } = requestData;

  // Validate input
  if (!aggregates || !dateRange) {
    return NextResponse.json(
      { error: 'Missing required data' },
      { status: 400 }
    );
  }

  try {
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

        // Check if Gemini is available (preferred)
        if (firebaseGemini.isAvailable()) {
          console.log('Using Gemini for AI insights...');
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

            const insights = await firebaseGemini.generateSpendingAnalysis(
              transactions.map((t: any) => ({
                name: t.name,
                amount: t.amount,
                category: t.categoryName || t.categoryId,
                date: t.date
              })),
              `${dateRange.from} to ${dateRange.to}`
            );
            
            // Convert Gemini format to expected API format
            const formattedInsights = {
              summary: insights.insights.join(' '),
              highlights: insights.insights,
              recommendations: insights.recommendations.map((rec: string) => ({
                title: rec.split(':')[0] || 'Recommendation',
                description: rec,
                priority: 'medium' as const
              })),
              quote: getNonRepeatingTip(userId, dateRange)
            };
            
            aiCache.set(cacheKey, formattedInsights, 30 * 1000); // Reduced to 30 seconds for more frequent updates
            return NextResponse.json({
              ...formattedInsights,
              aiPowered: true,
              provider: 'gemini'
            });
          } catch (geminiError) {
            console.error('Gemini error, falling back to rule-based insights:', geminiError);
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
        const insights = generateFinancialInsights(aggregates, dateRange, currency, userId);
        return NextResponse.json({
          ...insights,
          fallback: true
        });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    
    // Always fallback to rule-based insights if anything fails
    try {
      // Use the already parsed data from the beginning of the function
      if (aggregates && dateRange && currency) {
        const insights = generateFinancialInsights(aggregates, dateRange, currency, userId);
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
          quote: 'Track your daily coffee purchases - small expenses add up quickly over time.'
        },
        { status: 200 } // Return 200 to prevent UI errors
      );
    }
  }
}

function generateFinancialInsights(
  aggregates: FinancialAggregates,
  dateRange: { from: string; to: string },
  currency: string,
  userId: string
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

  // Select a non-repeating tip based on date and user
  const tip = getNonRepeatingTip(userId, dateRange);

  return {
    summary,
    highlights,
    recommendations,
    quote: tip
  };
}

function generateSummary(
  aggregates: FinancialAggregates,
  dateRangeStr: string,
  currency: string,
  daysDiff: number
): string {
  const { totalIncome, totalExpenses, netIncome, transactionCount, topCategories, averageTransaction } = aggregates;
  
  // Calculate key metrics
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;
  const dailySpending = daysDiff > 0 ? (totalExpenses / daysDiff) : 0;
  const monthlyProjection = dailySpending * 30;
  
  let summary = `📊 Financial Overview for ${dateRangeStr}:\n\n`;
  
  // Income and Expense Analysis
  summary += `• Total Income: ${currency}${totalIncome.toFixed(2)}\n`;
  summary += `• Total Expenses: ${currency}${totalExpenses.toFixed(2)}\n`;
  
  if (netIncome > 0) {
    summary += `• ✅ Net Income: ${currency}${netIncome.toFixed(2)} (${savingsRate.toFixed(1)}% savings rate)\n`;
  } else if (netIncome < 0) {
    summary += `• ⚠️ Net Loss: ${currency}${Math.abs(netIncome).toFixed(2)} (${Math.abs(savingsRate).toFixed(1)}% overspending)\n`;
  } else {
    summary += `• ⚖️ Break-even: No net income\n`;
  }
  
  // Spending Patterns
  summary += `• ${transactionCount} transactions processed\n`;
  summary += `• Average transaction: ${currency}${averageTransaction.toFixed(2)}\n`;
  
  if (daysDiff > 1) {
    summary += `• Daily spending average: ${currency}${dailySpending.toFixed(2)}\n`;
    summary += `• Monthly projection: ${currency}${monthlyProjection.toFixed(2)}\n`;
  }
  
  // Top Categories Insight
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const percentage = (topCategory.amount / totalExpenses) * 100;
    summary += `• Top spending category: ${topCategory.name} (${currency}${topCategory.amount.toFixed(2)} - ${percentage.toFixed(1)}% of expenses)\n`;
    
    if (percentage > 40) {
      summary += `• ⚠️ This category is unusually high - consider reviewing\n`;
    } else if (percentage > 25) {
      summary += `• 📊 This is your primary expense category\n`;
    }
  }
  
  // Financial Health Assessment
  if (savingsRate > 20) {
    summary += `• 🟢 Excellent savings rate - you're building wealth effectively\n`;
  } else if (savingsRate > 10) {
    summary += `• 🟡 Good savings rate - room for improvement\n`;
  } else if (savingsRate > 0) {
    summary += `• 🟠 Low savings rate - consider increasing income or reducing expenses\n`;
  } else {
    summary += `• 🔴 Negative savings rate - immediate attention needed\n`;
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

  // Calculate key insights
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;
  const dailySpending = daysDiff > 0 ? (totalExpenses / daysDiff) : 0;
  const monthlyProjection = dailySpending * 30;

  // Financial Health Status
  if (savingsRate > 20) {
    highlights.push(`🟢 Excellent financial health: ${savingsRate.toFixed(1)}% savings rate`);
  } else if (savingsRate > 10) {
    highlights.push(`🟡 Good financial health: ${savingsRate.toFixed(1)}% savings rate`);
  } else if (savingsRate > 0) {
    highlights.push(`🟠 Room for improvement: ${savingsRate.toFixed(1)}% savings rate`);
  } else {
    highlights.push(`🔴 Financial attention needed: ${Math.abs(savingsRate).toFixed(1)}% overspending`);
  }

  // Transaction Pattern Analysis
  if (transactionCount > 0) {
    const frequency = daysDiff > 0 ? (transactionCount / daysDiff) : transactionCount;
    if (frequency > 3) {
      highlights.push(`📊 High transaction frequency: ${frequency.toFixed(1)} transactions per day`);
    } else if (frequency > 1) {
      highlights.push(`📈 Moderate transaction frequency: ${frequency.toFixed(1)} transactions per day`);
    } else {
      highlights.push(`📉 Low transaction frequency: ${frequency.toFixed(1)} transactions per day`);
    }
  }

  // Spending Category Analysis
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const percentage = (topCategory.amount / totalExpenses) * 100;
    
    if (percentage > 40) {
      highlights.push(`⚠️ Dominant spending: ${topCategory.name} (${percentage.toFixed(1)}% of expenses)`);
    } else if (percentage > 25) {
      highlights.push(`🎯 Primary expense: ${topCategory.name} (${percentage.toFixed(1)}% of expenses)`);
    } else {
      highlights.push(`📊 Top category: ${topCategory.name} (${percentage.toFixed(1)}% of expenses)`);
    }
  }

  // Spending Velocity Analysis
  if (daysDiff > 1) {
    if (dailySpending > (totalIncome / daysDiff) * 0.8) {
      highlights.push(`⚡ High spending velocity: ${currency}${dailySpending.toFixed(2)}/day (${currency}${monthlyProjection.toFixed(2)}/month projected)`);
    } else if (dailySpending > (totalIncome / daysDiff) * 0.5) {
      highlights.push(`📊 Moderate spending: ${currency}${dailySpending.toFixed(2)}/day (${currency}${monthlyProjection.toFixed(2)}/month projected)`);
    } else {
      highlights.push(`💰 Conservative spending: ${currency}${dailySpending.toFixed(2)}/day (${currency}${monthlyProjection.toFixed(2)}/month projected)`);
    }
  }

  // Average Transaction Insight
  if (averageTransaction > 100) {
    highlights.push(`💳 High-value transactions: ${currency}${averageTransaction.toFixed(2)} average`);
  } else if (averageTransaction > 50) {
    highlights.push(`💵 Moderate-value transactions: ${currency}${averageTransaction.toFixed(2)} average`);
  } else {
    highlights.push(`🪙 Small-value transactions: ${currency}${averageTransaction.toFixed(2)} average`);
  }

  return highlights.slice(0, 5); // Limit to 5 highlights
}

function generateRecommendations(
  aggregates: FinancialAggregates,
  currency: string
): Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> {
  const { totalIncome, totalExpenses, netIncome, topCategories, averageTransaction, transactionCount } = aggregates;
  const recommendations: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> = [];

  // Calculate key metrics
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100) : 100;

  // Critical Financial Health Issues
  if (netIncome < 0) {
    const deficit = Math.abs(netIncome);
    const monthlyDeficit = deficit * 30; // Rough monthly projection
    recommendations.push({
      title: '🚨 Critical: Address Negative Cash Flow',
      description: `You're spending ${currency}${deficit.toFixed(2)} more than earning. At this rate, you'll be ${currency}${monthlyDeficit.toFixed(2)} in debt monthly. Immediate action required: cut expenses by ${currency}${(deficit * 1.2).toFixed(2)} or increase income.`,
      priority: 'high'
    });
  }

  // High-Risk Spending Patterns
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const percentage = (topCategory.amount / totalExpenses) * 100;
    
    if (percentage > 50) {
      recommendations.push({
        title: '⚠️ Critical: Dominant Spending Category',
        description: `${topCategory.name} consumes ${percentage.toFixed(1)}% of your budget (${currency}${topCategory.amount.toFixed(2)}). This creates financial vulnerability. Diversify spending or set strict limits.`,
        priority: 'high'
      });
    } else if (percentage > 35) {
      recommendations.push({
        title: '🎯 High Priority: Manage Top Category',
        description: `${topCategory.name} represents ${percentage.toFixed(1)}% of expenses (${currency}${topCategory.amount.toFixed(2)}). Set a monthly budget limit of ${currency}${(topCategory.amount * 0.8).toFixed(2)} to improve balance.`,
        priority: 'high'
      });
    }
  }

  // Savings Rate Optimization
  if (netIncome > 0) {
    if (savingsRate < 5) {
      recommendations.push({
        title: '🔴 Urgent: Increase Savings Rate',
        description: `Only saving ${savingsRate.toFixed(1)}% (${currency}${netIncome.toFixed(2)}) is insufficient for financial security. Target 20% minimum. Cut ${currency}${(totalExpenses * 0.15).toFixed(2)} in expenses to reach 20% savings rate.`,
        priority: 'high'
      });
    } else if (savingsRate < 15) {
      recommendations.push({
        title: '🟡 Improve Savings Rate',
        description: `Current ${savingsRate.toFixed(1)}% savings rate (${currency}${netIncome.toFixed(2)}) is below recommended 20%. Reduce expenses by ${currency}${(totalExpenses * 0.1).toFixed(2)} to reach 15% savings rate.`,
        priority: 'medium'
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        title: '🟢 Excellent: Optimize Savings',
        description: `Outstanding ${savingsRate.toFixed(1)}% savings rate! Consider: 1) Emergency fund (3-6 months expenses), 2) Investment portfolio, 3) Retirement accounts. You're building wealth effectively.`,
        priority: 'low'
      });
    }
  }

  // Transaction Pattern Analysis
  if (transactionCount > 100) {
    const avgPerDay = transactionCount / 30; // Assuming monthly data
    recommendations.push({
      title: '📊 Optimize Transaction Patterns',
      description: `${transactionCount} transactions (${avgPerDay.toFixed(1)}/day) suggests frequent small purchases. Consolidate to reduce fees, improve tracking, and save time. Target <50 transactions/month.`,
      priority: 'medium'
    });
  }

  // High-Value Transaction Analysis
  if (averageTransaction > 200) {
    recommendations.push({
      title: '💳 Review High-Value Transactions',
      description: `Average transaction of ${currency}${averageTransaction.toFixed(2)} indicates significant purchases. Ensure these align with your financial goals and consider bulk buying discounts.`,
      priority: 'medium'
    });
  }

  // Income Optimization
  if (totalIncome > 0 && expenseRatio > 90) {
    recommendations.push({
      title: '💰 Income Growth Opportunity',
      description: `Spending ${expenseRatio.toFixed(1)}% of income leaves little room for growth. Consider: 1) Side income streams, 2) Skill development, 3) Investment income. Even 10% income increase creates significant impact.`,
      priority: 'medium'
    });
  }

  // Emergency Fund Recommendation
  if (netIncome > 0 && savingsRate > 10) {
    const monthlyExpenses = totalExpenses;
    const emergencyFundTarget = monthlyExpenses * 6;
    recommendations.push({
      title: '🛡️ Build Emergency Fund',
      description: `With positive cash flow, prioritize emergency fund: ${currency}${emergencyFundTarget.toFixed(2)} (6 months expenses). This provides financial security and reduces stress.`,
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

/**
 * Get a non-repeating expense management tip based on user ID and date
 */
function getNonRepeatingTip(userId: string, dateRange: { from: string; to: string }): string {
  // Create a deterministic seed based on user ID and date range
  const seed = `${userId}-${dateRange.from}-${dateRange.to}`;
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const tipIndex = Math.abs(hash) % EXPENSE_MANAGEMENT_TIPS.length;
  
  return EXPENSE_MANAGEMENT_TIPS[tipIndex];
}
