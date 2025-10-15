import { Groq } from 'groq-sdk';

interface CategorySuggestion {
  name: string;
  confidence: number;
  isExisting: boolean;
  categoryId?: string;
}

interface CategorySuggestionResponse {
  suggestions: CategorySuggestion[];
  newCategories: string[];
}

class AICategorySuggestionsService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async getCategorySuggestions(
    transactionName: string,
    transactionType: 'income' | 'expense',
    existingCategories: Array<{ id: string; name: string; type: 'income' | 'expense' }>
  ): Promise<CategorySuggestionResponse> {
    try {
      const prompt = this.buildCategorySuggestionPrompt(
        transactionName,
        transactionType,
        existingCategories
      );

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a financial categorization expert. Analyze transaction names and suggest appropriate categories.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseCategorySuggestions(response, existingCategories);
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      return this.getFallbackSuggestions(transactionName, transactionType, existingCategories);
    }
  }

  private buildCategorySuggestionPrompt(
    transactionName: string,
    transactionType: 'income' | 'expense',
    existingCategories: Array<{ id: string; name: string; type: 'income' | 'expense' }>
  ): string {
    const relevantCategories = existingCategories.filter(cat => cat.type === transactionType);
    const categoryList = relevantCategories.map(cat => cat.name).join(', ');

    return `
Analyze this ${transactionType} transaction: "${transactionName}"

Existing ${transactionType} categories: ${categoryList}

Please suggest:
1. The best matching existing category (if any) with confidence score
2. Up to 3 new category suggestions if no good existing match

Return your response as JSON in this format:
{
  "existingMatch": {
    "name": "category name",
    "confidence": 0.85
  },
  "newSuggestions": [
    "New Category 1",
    "New Category 2", 
    "New Category 3"
  ]
}

Focus on:
- For expenses: food, transportation, entertainment, utilities, shopping, healthcare, etc.
- For income: salary, freelance, investment, business, gifts, etc.
- Be specific and relevant to the transaction name
- Consider common financial categories
`;
  }

  private parseCategorySuggestions(
    response: string,
    existingCategories: Array<{ id: string; name: string; type: 'income' | 'expense' }>
  ): CategorySuggestionResponse {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      const suggestions: CategorySuggestion[] = [];
      const newCategories: string[] = [];

      // Add existing match if found
      if (data.existingMatch && data.existingMatch.name) {
        const existingCategory = existingCategories.find(
          cat => cat.name.toLowerCase() === data.existingMatch.name.toLowerCase()
        );
        
        if (existingCategory) {
          suggestions.push({
            name: data.existingMatch.name,
            confidence: data.existingMatch.confidence || 0.8,
            isExisting: true,
            categoryId: existingCategory.id
          });
        }
      }

      // Add new category suggestions
      if (data.newSuggestions && Array.isArray(data.newSuggestions)) {
        data.newSuggestions.forEach((suggestion: string) => {
          if (suggestion && typeof suggestion === 'string') {
            suggestions.push({
              name: suggestion,
              confidence: 0.7,
              isExisting: false
            });
            newCategories.push(suggestion);
          }
        });
      }

      return { suggestions, newCategories };
    } catch (error) {
      console.error('Error parsing category suggestions:', error);
      return { suggestions: [], newCategories: [] };
    }
  }

  private getFallbackSuggestions(
    transactionName: string,
    transactionType: 'income' | 'expense',
    existingCategories: Array<{ id: string; name: string; type: 'income' | 'expense' }>
  ): CategorySuggestionResponse {
    const suggestions: CategorySuggestion[] = [];
    const newCategories: string[] = [];

    // Simple keyword-based fallback
    const name = transactionName.toLowerCase();
    
    if (transactionType === 'expense') {
      if (name.includes('food') || name.includes('restaurant') || name.includes('coffee')) {
        suggestions.push({ name: 'Food & Dining', confidence: 0.8, isExisting: false });
        newCategories.push('Food & Dining');
      } else if (name.includes('gas') || name.includes('fuel') || name.includes('transport')) {
        suggestions.push({ name: 'Transportation', confidence: 0.8, isExisting: false });
        newCategories.push('Transportation');
      } else if (name.includes('grocery') || name.includes('supermarket')) {
        suggestions.push({ name: 'Groceries', confidence: 0.9, isExisting: false });
        newCategories.push('Groceries');
      } else {
        suggestions.push({ name: 'General Expense', confidence: 0.6, isExisting: false });
        newCategories.push('General Expense');
      }
    } else {
      if (name.includes('salary') || name.includes('payroll')) {
        suggestions.push({ name: 'Salary', confidence: 0.9, isExisting: false });
        newCategories.push('Salary');
      } else if (name.includes('freelance') || name.includes('contract')) {
        suggestions.push({ name: 'Freelance', confidence: 0.8, isExisting: false });
        newCategories.push('Freelance');
      } else {
        suggestions.push({ name: 'Other Income', confidence: 0.6, isExisting: false });
        newCategories.push('Other Income');
      }
    }

    return { suggestions, newCategories };
  }
}

export const aiCategorySuggestionsService = new AICategorySuggestionsService();
