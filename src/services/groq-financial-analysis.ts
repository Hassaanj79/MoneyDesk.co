import Groq from 'groq-sdk';

// Lazy initialization of Groq client
let groq: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

export interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  currency: string;
  dateRange: { from: string; to: string };
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
  highlights: Array<{ title: string; description: string; type?: string; priority?: 'low' | 'medium' | 'high' }>;
  recommendations: Array<{ title: string; description: string; action?: string; priority: 'low' | 'medium' | 'high' }>;
  quote: string;
}

class GroqFinancialAnalysisService {
  private buildFinancialAnalysisPrompt(data: FinancialData): string {
    const { totalIncome, totalExpense, netSavings, currency, dateRange, transactions, categories } = data;

    let prompt = `Analyze the following financial data for the period ${data.dateRange.from} to ${data.dateRange.to} in ${currency}:\n\n`;
    prompt += `Total Income: ${currency}${totalIncome.toFixed(2)}\n`;
    prompt += `Total Expenses: ${currency}${totalExpense.toFixed(2)}\n`;
    prompt += `Net Savings (Income - Expenses): ${currency}${netSavings.toFixed(2)}\n\n`;

    if (categories && categories.length > 0) {
      prompt += "Category Breakdown (Top 5 by expense):\n";
      categories
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5)
        .forEach(cat => {
          prompt += `- ${cat.name}: ${currency}${cat.totalAmount.toFixed(2)} (${cat.transactionCount} transactions)\n`;
        });
      prompt += "\n";
    }

    if (transactions && transactions.length > 0) {
      prompt += "Recent Transactions (up to 10):\n";
      transactions.slice(0, 10).forEach(t => {
        prompt += `- ${t.date} | ${t.type.toUpperCase()} | ${t.name} (${t.category}): ${currency}${t.amount.toFixed(2)}\n`;
      });
      prompt += "\n";
    }

        prompt += `Based on this data, provide a financial summary, key highlights, actionable recommendations, and an inspirational financial quote. 
        
        CRITICAL: Your response must be ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. No code blocks, no additional text.
        
        The JSON structure must be exactly:
        {
          "summary": "string",
          "highlights": [
            { "title": "string", "description": "string", "type": "positive", "priority": "high" }
          ],
          "recommendations": [
            { "title": "string", "description": "string", "action": "string", "priority": "medium" }
          ],
          "quote": "string"
        }
        
        Rules:
        - Start your response with { and end with }
        - Use double quotes for all strings
        - Ensure all JSON is properly formatted
        - No trailing commas
        - No markdown formatting
        - No explanations outside the JSON
        
        Ensure the descriptions are concise and professional. Recommendations should be practical and directly actionable.
        `;

    return prompt;
  }

  /**
   * Generate comprehensive financial insights using Groq
   */
  public async generateFinancialInsights(data: FinancialData): Promise<AIFinancialInsights> {
    try {
      const client = getGroqClient();
      if (!client) {
        throw new Error('Groq client not available - API key not configured');
      }

      const prompt = this.buildFinancialAnalysisPrompt(data);
      
      // Try multiple models in case of capacity issues
      const models = ["llama-3.1-8b-instant"];
      let lastError: Error | null = null;
      
      for (const model of models) {
        try {
          const completion = await client.chat.completions.create({
            messages: [
              {
                role: "system",
                content: `You are a professional financial advisor and AI assistant specializing in personal finance analysis. 
                You provide insightful, actionable, and personalized financial advice based on transaction data.
                
                CRITICAL RULES:
                1. Your response must be ONLY a valid JSON object
                2. No markdown formatting (no code blocks)
                3. No explanations or additional text
                4. Start with { and end with }
                5. Use double quotes for all strings
                6. No trailing commas
                7. The JSON must match the exact schema provided in the user prompt
                
                If you cannot provide a valid JSON response, do not respond at all.`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 2000,
          });

          const rawResponse = completion.choices[0].message.content;
          if (!rawResponse) {
            throw new Error('Groq returned an empty response.');
          }

          // Clean and parse JSON response
          let cleanedResponse = rawResponse.trim();
          
          // Remove any markdown code blocks if present
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Fix common JSON issues
          cleanedResponse = cleanedResponse
            .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
            .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();

          // Try to parse the JSON with better error handling
          let insights: AIFinancialInsights;
          try {
            insights = JSON.parse(cleanedResponse);
            
            // Validate the response structure
            if (!insights.summary || !insights.highlights || !insights.recommendations || !insights.quote) {
              throw new Error('Invalid response structure from Groq');
            }
            
            // Ensure highlights and recommendations are arrays
            if (!Array.isArray(insights.highlights) || !Array.isArray(insights.recommendations)) {
              throw new Error('Invalid array structure in Groq response');
            }
            
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw response:', rawResponse);
            console.error('Cleaned response:', cleanedResponse);
            
            // Try to extract JSON from the response if it's embedded in text
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                insights = JSON.parse(jsonMatch[0]);
                console.log('Successfully extracted JSON from embedded text');
              } catch (extractError) {
                console.error('Failed to extract JSON:', extractError);
                throw new Error(`Invalid JSON response from Groq: ${parseError}`);
              }
            } else {
              throw new Error(`Invalid JSON response from Groq: ${parseError}`);
            }
          }

          return insights;
        } catch (modelError) {
          console.warn(`Model ${model} failed:`, modelError);
          lastError = modelError as Error;
          continue; // Try next model
        }
      }
      
      // If all models failed, throw the last error
      throw lastError || new Error('All Groq models failed');

    } catch (error) {
      console.error('Error generating Groq insights:', error);
      throw error;
    }
  }
}

export const groqFinancialAnalysis = new GroqFinancialAnalysisService();
