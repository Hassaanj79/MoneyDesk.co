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

export interface CategorySuggestion {
  name: string;
  confidence: number;
  reason?: string;
}

// Fallback function for category suggestions
export function generateFallbackSuggestions(description: string, type: 'income' | 'expense', existingCategories: string[]): CategorySuggestion[] {
  const lowerDescription = description.toLowerCase();
  const suggestions: CategorySuggestion[] = [];

  // Simple keyword matching for common categories
  if (type === 'expense') {
    if (lowerDescription.includes('coffee') || lowerDescription.includes('cafe') || lowerDescription.includes('restaurant') || lowerDescription.includes('food')) {
      suggestions.push({ name: 'Food & Dining', confidence: 70, reason: 'Matches keywords: coffee, food' });
    }
    if (lowerDescription.includes('uber') || lowerDescription.includes('taxi') || lowerDescription.includes('bus') || lowerDescription.includes('train')) {
      suggestions.push({ name: 'Transportation', confidence: 70, reason: 'Matches keywords: uber, taxi' });
    }
    if (lowerDescription.includes('rent') || lowerDescription.includes('mortgage')) {
      suggestions.push({ name: 'Housing', confidence: 80, reason: 'Matches keywords: rent, mortgage' });
    }
    if (lowerDescription.includes('electricity') || lowerDescription.includes('water') || lowerDescription.includes('gas bill')) {
      suggestions.push({ name: 'Utilities', confidence: 75, reason: 'Matches keywords: electricity, water' });
    }
    if (lowerDescription.includes('shopping') || lowerDescription.includes('clothes') || lowerDescription.includes('store')) {
      suggestions.push({ name: 'Shopping', confidence: 65, reason: 'Matches keywords: shopping, clothes' });
    }
  } else if (type === 'income') {
    if (lowerDescription.includes('salary') || lowerDescription.includes('paycheck')) {
      suggestions.push({ name: 'Salary', confidence: 85, reason: 'Matches keywords: salary, paycheck' });
    }
    if (lowerDescription.includes('freelance') || lowerDescription.includes('consulting')) {
      suggestions.push({ name: 'Freelance', confidence: 75, reason: 'Matches keywords: freelance, consulting' });
    }
  }

  // Add any existing categories that are highly relevant but not yet suggested
  existingCategories.forEach(cat => {
    if (lowerDescription.includes(cat.toLowerCase()) && !suggestions.some(s => s.name === cat)) {
      suggestions.push({ name: cat, confidence: 90, reason: `Matches existing category: ${cat}` });
    }
  });

  // Ensure unique suggestions and sort by confidence
  const uniqueSuggestions = Array.from(new Map(suggestions.map(s => [s.name, s])).values());
  return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
}

export async function generateGroqCategorySuggestions(description: string, type: 'income' | 'expense', existingCategories: string[]): Promise<CategorySuggestion[]> {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq client not available - API key not configured');
  }

  const prompt = `Given the transaction description "${description}" (type: ${type}), suggest up to 3 relevant financial categories from the following list of existing categories: [${existingCategories.join(', ')}]. If no existing category is suitable, suggest a new, appropriate category.
  Provide the output as a JSON array of objects, each with a "name" (category name), "confidence" (0-100 integer), and "reason" (brief explanation).
  Example: [{"name": "Food & Dining", "confidence": 90, "reason": "Common expense for coffee"}, {"name": "New Category", "confidence": 70, "reason": "No existing match"}]`;

  const completion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specializing in financial transaction categorization. Your task is to suggest the most relevant category for a given transaction description.
        Your output MUST be a JSON array of objects matching the specified schema. Do not include any other text or markdown outside the JSON.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
    max_tokens: 500,
  });

  const rawResponse = completion.choices[0].message.content;
  if (!rawResponse) {
    throw new Error('Groq returned an empty response.');
  }

  const parsedResponse = JSON.parse(rawResponse);
  if (!Array.isArray(parsedResponse)) {
    throw new Error('Groq response is not a valid JSON array.');
  }

  return parsedResponse as CategorySuggestion[];
}
