import { ai } from '@/lib/firebase';
import { getGenerativeModel, GenerativeModel } from 'firebase/ai';

export interface GeminiReceiptData {
  merchant?: string;
  amount?: number;
  date?: Date;
  items?: Array<{
    name: string;
    price: number;
  }>;
  total?: number;
  tax?: number;
  subtotal?: number;
  tip?: number;
  paymentMethod?: string;
  confidence: number;
  rawText: string;
}

export interface GeminiFinancialInsight {
  category: string;
  confidence: number;
  reasoning: string;
  suggestedActions?: string[];
}

export interface GeminiSpendingAnalysis {
  insights: string[];
  recommendations: string[];
  trends: string[];
  alerts: string[];
}

class FirebaseGeminiService {
  private model: GenerativeModel | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeModel();
  }

  private initializeModel() {
    if (this.isInitialized) return;

    try {
      if (!ai) {
        console.warn('Firebase AI not initialized. Gemini features will be disabled.');
        return;
      }

      // Initialize the Gemini model using the correct API
      this.model = getGenerativeModel(ai, {
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      this.isInitialized = true;
      console.log('Firebase Gemini model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Gemini model:', error);
      this.model = null;
    }
  }

  /**
   * Process receipt text using Gemini for intelligent parsing
   */
  public async processReceiptWithGemini(receiptText: string): Promise<GeminiReceiptData> {
    if (!this.model) {
      throw new Error('Firebase Gemini model not initialized');
    }

    const prompt = `
You are an expert at parsing receipt text and extracting financial transaction data. 
Analyze the following receipt text and extract structured information.

Receipt Text:
${receiptText}

Please extract and return ONLY a valid JSON object with the following structure:
{
  "merchant": "Store/restaurant name if identifiable",
  "amount": "Total amount as a number (not string)",
  "date": "Date in ISO format (YYYY-MM-DD) if found",
  "items": [
    {"name": "item name", "price": "price as number"}
  ],
  "total": "Total amount as number",
  "tax": "Tax amount as number if found",
  "subtotal": "Subtotal before tax as number if found",
  "tip": "Tip amount as number if found",
  "paymentMethod": "Payment method if mentioned",
  "confidence": "Confidence score 0-1 based on data quality"
}

CRITICAL RULES:
1. Return ONLY valid JSON - no explanations, no markdown, no extra text
2. Use null for missing values, not empty strings or undefined
3. Convert all amounts to numbers (not strings)
4. Be conservative with confidence scores (0.3-1.0)
5. Merchant name: clean brand only (e.g., "Starbucks" from "Starbucks Lahore")
6. Date format: YYYY-MM-DD only
7. Amount: TOTAL amount only, not individual items
8. NO trailing commas, NO extra characters
9. Example valid JSON: {"merchant":"Starbucks","amount":5.00,"date":"2024-01-15","total":5.00,"tax":0.50,"subtotal":4.50,"tip":null,"paymentMethod":null,"confidence":0.9}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean and parse the JSON response
      let cleanedText = text.trim();
      
      // Remove any markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to extract JSON from the response with better error handling
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.log('Initial JSON parse failed, trying to extract JSON...');
        console.log('Raw response:', cleanedText);
        
        // Try multiple strategies to extract valid JSON
        let jsonText = cleanedText;
        
        // Strategy 1: Extract JSON object from text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        // Strategy 2: Clean up common JSON issues
        jsonText = jsonText
          .replace(/,\s*}/g, '}')  // Remove trailing commas before }
          .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
          .replace(/\n/g, ' ')     // Replace newlines with spaces
          .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
          .trim();
        
        try {
          parsedData = JSON.parse(jsonText);
        } catch (secondError) {
          console.error('JSON parsing failed after cleanup:', secondError);
          console.error('Cleaned text:', jsonText);
          
          // Strategy 3: Try to extract individual fields manually
          parsedData = this.extractFieldsManually(cleanedText);
        }
      }
      
      // Add the raw text and ensure confidence is set
      return {
        ...parsedData,
        rawText: receiptText,
        confidence: parsedData.confidence || 0.5
      };
    } catch (error) {
      console.error('Error processing receipt with Gemini:', error);
      throw new Error('Failed to process receipt with Gemini');
    }
  }

  /**
   * Manually extract fields from text when JSON parsing fails
   */
  private extractFieldsManually(text: string): any {
    console.log('Attempting manual field extraction from:', text);
    
    const result: any = {
      merchant: null,
      amount: null,
      date: null,
      items: [],
      total: null,
      tax: null,
      subtotal: null,
      tip: null,
      paymentMethod: null,
      confidence: 0.3
    };

    try {
      // Extract merchant name (look for common patterns)
      const merchantPatterns = [
        /"merchant":\s*"([^"]+)"/i,
        /merchant[:\s]+([^\n,]+)/i,
        /store[:\s]+([^\n,]+)/i,
        /restaurant[:\s]+([^\n,]+)/i
      ];
      
      for (const pattern of merchantPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.merchant = match[1].trim().replace(/['"]/g, '');
          break;
        }
      }

      // Extract amount (look for numbers with $ or currency symbols)
      const amountPatterns = [
        /"amount":\s*(\d+\.?\d*)/i,
        /"total":\s*(\d+\.?\d*)/i,
        /total[:\s]*\$?(\d+\.?\d*)/i,
        /\$(\d+\.?\d*)/g
      ];
      
      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.amount = parseFloat(match[1]);
          result.total = result.amount;
          break;
        }
      }

      // Extract date
      const datePatterns = [
        /"date":\s*"([^"]+)"/i,
        /date[:\s]+([^\n,]+)/i,
        /(\d{4}-\d{2}-\d{2})/i,
        /(\d{2}\/\d{2}\/\d{4})/i
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.date = match[1].trim().replace(/['"]/g, '');
          break;
        }
      }

      console.log('Manual extraction result:', result);
      return result;
    } catch (error) {
      console.error('Manual extraction failed:', error);
      return result;
    }
  }

  /**
   * Get intelligent category suggestions using Gemini
   */
  public async getCategorySuggestions(
    transactionName: string,
    amount: number,
    existingCategories: string[]
  ): Promise<GeminiFinancialInsight[]> {
    if (!this.model) {
      throw new Error('Firebase Gemini model not initialized');
    }

    const prompt = `
You are a financial categorization expert. Analyze this transaction and suggest the most appropriate category based on the merchant name and business type.

Transaction Details:
- Merchant: "${transactionName}"
- Amount: $${amount}
- Available Categories: ${existingCategories.join(', ')}

Categorization Rules:
- Starbucks, Coffee shops, Cafes → Food & Dining
- McDonald's, Burger King, KFC, Fast food → Food & Dining  
- Amazon, Online stores, E-commerce → Shopping
- Netflix, Spotify, Subscriptions → Subscriptions
- Gas stations, Fuel, Petrol → Transportation
- Grocery stores, Supermarkets → Food & Dining
- Restaurants, Dining → Food & Dining
- Clothing stores, Fashion → Shopping
- Entertainment venues → Entertainment

Return ONLY a valid JSON array with suggestions:
[
  {
    "category": "Most appropriate category from available list",
    "confidence": 0.95,
    "reasoning": "Brief explanation based on merchant type and business",
    "suggestedActions": []
  }
]

Rules:
1. Choose the most appropriate category from the available list
2. Consider the merchant name and business type
3. Provide high confidence (0.8+) for obvious matches
4. Return ONLY valid JSON array
5. No explanations outside the JSON
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error getting category suggestions with Gemini:', error);
      throw new Error('Failed to get category suggestions');
    }
  }

  /**
   * Generate comprehensive spending analysis using Gemini
   */
  public async generateSpendingAnalysis(
    transactions: Array<{
      name: string;
      amount: number;
      category: string;
      date: string;
    }>,
    timeRange: string = 'last 30 days'
  ): Promise<GeminiSpendingAnalysis> {
    if (!this.model) {
      throw new Error('Firebase Gemini model not initialized');
    }

    const transactionSummary = transactions
      .map(t => `${t.name}: $${t.amount} (${t.category})`)
      .join('\n');

    const prompt = `
You are a personal finance advisor. Analyze these transactions and provide insights.

Time Range: ${timeRange}
Transactions:
${transactionSummary}

Return ONLY a valid JSON object:
{
  "insights": ["Key insights about spending patterns"],
  "recommendations": ["Actionable recommendations"],
  "trends": ["Notable trends observed"],
  "alerts": ["Important alerts or warnings"]
}

Rules:
1. Provide 3-5 insights maximum
2. Give 2-4 actionable recommendations
3. Identify 2-3 key trends
4. Include any important alerts
5. Be specific and helpful
6. Only return valid JSON, no explanations
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error generating spending analysis with Gemini:', error);
      throw new Error('Failed to generate spending analysis');
    }
  }

  /**
   * Detect duplicate transactions using Gemini
   */
  public async detectDuplicates(
    newTransaction: { name: string; amount: number; date: string },
    existingTransactions: Array<{ name: string; amount: number; date: string }>
  ): Promise<{ isDuplicate: boolean; confidence: number; reason: string }> {
    if (!this.model) {
      throw new Error('Firebase Gemini model not initialized');
    }

    const existingSummary = existingTransactions
      .slice(-10) // Last 10 transactions
      .map(t => `${t.name}: $${t.amount} (${t.date})`)
      .join('\n');

    const prompt = `
You are a duplicate transaction detector. Check if this new transaction is a duplicate.

New Transaction:
- Name: "${newTransaction.name}"
- Amount: $${newTransaction.amount}
- Date: ${newTransaction.date}

Recent Transactions:
${existingSummary}

Return ONLY a valid JSON object:
{
  "isDuplicate": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation"
}

Rules:
1. Consider similar names, amounts, and dates
2. Account for slight variations in merchant names
3. Confidence should be high (0.8+) for clear duplicates
4. Only return valid JSON, no explanations
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error detecting duplicates with Gemini:', error);
      throw new Error('Failed to detect duplicates');
    }
  }

  /**
   * Check if the service is available
   */
  public isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Get model information
   */
  public getModelInfo(): { name: string; available: boolean } {
    return {
      name: 'gemini-2.5-flash',
      available: this.isAvailable()
    };
  }
}

// Export singleton instance
export const firebaseGemini = new FirebaseGeminiService();
