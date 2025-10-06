import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  currency: string;
  dateRange: {
    from: string;
    to: string;
  };
  transactions: Array<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    name: string;
    date: string;
  }>;
  categories: Array<{
    name: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}

export interface AIFinancialInsights {
  summary: string;
  highlights: Array<{
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  quote: string;
}

export class OpenAIFinancialAnalysisService {
  private static instance: OpenAIFinancialAnalysisService;

  public static getInstance(): OpenAIFinancialAnalysisService {
    if (!OpenAIFinancialAnalysisService.instance) {
      OpenAIFinancialAnalysisService.instance = new OpenAIFinancialAnalysisService();
    }
    return OpenAIFinancialAnalysisService.instance;
  }

  /**
   * Generate comprehensive financial insights using OpenAI GPT-4
   */
  public async generateFinancialInsights(data: FinancialData): Promise<AIFinancialInsights> {
    try {
      const client = getOpenAIClient();
      if (!client) {
        throw new Error('OpenAI client not available - API key not configured');
      }

      const prompt = this.buildFinancialAnalysisPrompt(data);
      
      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional financial advisor and AI assistant specializing in personal finance analysis. 
            You provide insightful, actionable, and personalized financial advice based on transaction data.
            
            Your responses should be:
            - Professional yet approachable
            - Data-driven and specific
            - Actionable with clear next steps
            - Encouraging and motivational
            - Focused on financial wellness and growth
            
            Always format your response as valid JSON with the following structure:
            {
              "summary": "A comprehensive 2-3 sentence summary of the financial situation",
              "highlights": [
                {
                  "title": "Brief title",
                  "description": "Detailed explanation",
                  "type": "positive|negative|neutral",
                  "priority": "low|medium|high"
                }
              ],
              "recommendations": [
                {
                  "title": "Action title",
                  "description": "Why this matters",
                  "action": "Specific action to take",
                  "priority": "low|medium|high"
                }
              ],
              "quote": "An inspiring financial quote"
            }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const insights = JSON.parse(response) as AIFinancialInsights;
      
      // Validate the response structure
      this.validateInsights(insights);
      
      return insights;
    } catch (error) {
      console.error('Error generating OpenAI insights:', error);
      
      // Fallback to rule-based insights if OpenAI fails
      return this.generateFallbackInsights(data);
    }
  }

  /**
   * Build a comprehensive prompt for financial analysis
   */
  private buildFinancialAnalysisPrompt(data: FinancialData): string {
    const { totalIncome, totalExpense, netSavings, currency, dateRange, transactions, categories } = data;
    
    // Calculate additional metrics
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    
    // Get top spending categories
    const topExpenseCategories = categories
      .filter(cat => cat.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
    
    // Get top income sources
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const topIncomeSources = incomeTransactions
      .reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += transaction.amount;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);
    
    const topIncomeCategories = Object.entries(topIncomeSources)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return `
Analyze the following financial data and provide comprehensive insights:

**PERIOD**: ${dateRange.from} to ${dateRange.to}
**CURRENCY**: ${currency}

**FINANCIAL SUMMARY**:
- Total Income: ${currency} ${totalIncome.toLocaleString()}
- Total Expenses: ${currency} ${totalExpense.toLocaleString()}
- Net Savings: ${currency} ${netSavings.toLocaleString()}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Expense Rate: ${expenseRate.toFixed(1)}%

**TOP EXPENSE CATEGORIES**:
${topExpenseCategories.map(cat => 
  `- ${cat.name}: ${currency} ${cat.totalAmount.toLocaleString()} (${cat.transactionCount} transactions)`
).join('\n')}

**TOP INCOME SOURCES**:
${topIncomeCategories.map(cat => 
  `- ${cat.category}: ${currency} ${cat.amount.toLocaleString()} (${cat.count} transactions)`
).join('\n')}

**TRANSACTION BREAKDOWN**:
- Total Transactions: ${transactions.length}
- Income Transactions: ${incomeTransactions.length}
- Expense Transactions: ${transactions.length - incomeTransactions.length}

**ANALYSIS REQUEST**:
Please provide:
1. A comprehensive summary of the financial health
2. Key highlights (both positive and areas for improvement)
3. Specific, actionable recommendations
4. An inspiring financial quote

Focus on:
- Spending patterns and optimization opportunities
- Savings potential and strategies
- Financial goal alignment
- Risk management and emergency fund status
- Investment and growth opportunities
- Budget optimization suggestions

Be specific with numbers and provide concrete next steps.
    `.trim();
  }

  /**
   * Validate the insights response structure
   */
  private validateInsights(insights: any): void {
    if (!insights.summary || typeof insights.summary !== 'string') {
      throw new Error('Invalid insights: missing or invalid summary');
    }
    
    if (!Array.isArray(insights.highlights)) {
      throw new Error('Invalid insights: highlights must be an array');
    }
    
    if (!Array.isArray(insights.recommendations)) {
      throw new Error('Invalid insights: recommendations must be an array');
    }
    
    if (!insights.quote || typeof insights.quote !== 'string') {
      throw new Error('Invalid insights: missing or invalid quote');
    }
  }

  /**
   * Generate fallback insights if OpenAI fails
   */
  private generateFallbackInsights(data: FinancialData): AIFinancialInsights {
    const { totalIncome, totalExpense, netSavings, currency } = data;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    let summary = '';
    let highlights: Array<{title: string; description: string; type: 'positive' | 'negative' | 'neutral'; priority: 'low' | 'medium' | 'high'}> = [];
    let recommendations: Array<{title: string; description: string; action: string; priority: 'low' | 'medium' | 'high'}> = [];
    
    if (netSavings > 0) {
      summary = `Great job! You saved ${currency} ${netSavings.toLocaleString()} with a ${savingsRate.toFixed(1)}% savings rate. This shows healthy financial discipline.`;
      highlights.push({
        title: "Positive Cash Flow",
        description: `You're saving ${currency} ${netSavings.toLocaleString()} per period, which is excellent for building wealth.`,
        type: "positive",
        priority: "high"
      });
    } else {
      summary = `You spent ${currency} ${Math.abs(netSavings).toLocaleString()} more than you earned. Let's work on improving your financial balance.`;
      highlights.push({
        title: "Negative Cash Flow",
        description: `You're spending more than you earn, which can lead to debt accumulation.`,
        type: "negative",
        priority: "high"
      });
    }
    
    if (savingsRate >= 20) {
      recommendations.push({
        title: "Consider Investment Options",
        description: "With a high savings rate, you could explore investment opportunities.",
        action: "Research low-risk investment options like index funds or high-yield savings accounts.",
        priority: "medium"
      });
    } else if (savingsRate < 10) {
      recommendations.push({
        title: "Increase Savings Rate",
        description: "Your savings rate is below the recommended 10-20%.",
        action: "Review your expenses and identify areas where you can cut back by 5-10%.",
        priority: "high"
      });
    }
    
    return {
      summary,
      highlights,
      recommendations,
      quote: "The best time to plant a tree was 20 years ago. The second best time is now."
    };
  }
}

export const openaiFinancialAnalysis = OpenAIFinancialAnalysisService.getInstance();
