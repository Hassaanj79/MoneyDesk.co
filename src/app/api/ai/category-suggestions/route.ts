import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/services/openai-financial-analysis';
import { generateGroqCategorySuggestions, generateFallbackSuggestions } from '@/services/groq-category-suggestions';

export async function POST(request: NextRequest) {
  try {
    const { description, type, existingCategories = [] } = await request.json();

    // Validate input
    if (!description || !type) {
      return NextResponse.json(
        { error: 'Missing required data: description and type are required' },
        { status: 400 }
      );
    }

    // Check if Groq API key is available (preferred - free)
    if (process.env.GROQ_API_KEY) {
      console.log('Using Groq for category suggestions...');
      try {
        const suggestions = await generateGroqCategorySuggestions(description, type, existingCategories);
        return NextResponse.json({
          suggestions,
          aiPowered: true,
          provider: 'groq'
        });
      } catch (error) {
        console.error('Groq error, falling back to rule-based suggestions:', error);
        return NextResponse.json({
          suggestions: generateFallbackSuggestions(description, type, existingCategories),
          fallback: true
        });
      }
    }

    // Check if OpenAI API key is available (fallback)
    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI for category suggestions...');
      try {
        const suggestions = await generateAICategorySuggestions(description, type, existingCategories);
        return NextResponse.json({
          suggestions,
          aiPowered: true,
          provider: 'openai'
        });
      } catch (error) {
        console.error('OpenAI error, falling back to rule-based suggestions:', error);
        return NextResponse.json({
          suggestions: generateFallbackSuggestions(description, type, existingCategories),
          fallback: true
        });
      }
    }

    // Fallback to rule-based suggestions
    console.log('No AI API keys found, using fallback category suggestions');
    return NextResponse.json({
      suggestions: generateFallbackSuggestions(description, type, existingCategories),
      fallback: true
    });
  } catch (error) {
    console.error('Error generating category suggestions:', error);
    
    // Fallback to rule-based suggestions if AI fails
    try {
      const { description, type, existingCategories = [] } = await request.json();
      return NextResponse.json({
        suggestions: generateFallbackSuggestions(description, type, existingCategories),
        fallback: true
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate category suggestions' },
        { status: 500 }
      );
    }
  }
}

async function generateAICategorySuggestions(
  description: string,
  type: 'income' | 'expense',
  existingCategories: string[]
): Promise<Array<{name: string; confidence: number; reason: string}>> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available');
    }

    const prompt = buildCategorySuggestionPrompt(description, type, existingCategories);
    
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a financial categorization expert. Your job is to suggest the most appropriate category for a financial transaction based on its description.

Rules:
1. Return exactly 3 category suggestions in JSON format
2. Each suggestion should have: name, confidence (0-100), and reason
3. Categories should be specific and actionable
4. Consider the transaction type (income vs expense)
5. Use existing categories when they make sense
6. Create new categories only when necessary
7. Be practical and user-friendly

Return format:
{
  "suggestions": [
    {
      "name": "Category Name",
      "confidence": 85,
      "reason": "Brief explanation why this category fits"
    }
  ]
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const result = JSON.parse(response);
    return result.suggestions || [];
  } catch (error) {
    console.error('Error in AI category suggestions:', error);
    throw error;
  }
}

function buildCategorySuggestionPrompt(
  description: string,
  type: 'income' | 'expense',
  existingCategories: string[]
): string {
  return `
Analyze this transaction and suggest the most appropriate category:

Transaction Description: "${description}"
Transaction Type: ${type}
Existing Categories: ${existingCategories.length > 0 ? existingCategories.join(', ') : 'None'}

Please suggest 3 categories that best match this transaction, considering:
- The description keywords and context
- The transaction type (${type})
- Whether existing categories are suitable
- Practical categorization for personal finance

Focus on being specific and helpful for expense tracking.
  `.trim();
}

function generateFallbackSuggestions(
  description: string,
  type: 'income' | 'expense',
  existingCategories: string[]
): Array<{name: string; confidence: number; reason: string}> {
  const lowerDesc = description.toLowerCase();
  
  // Common expense categories based on keywords
  const expenseKeywords = {
    'Food & Dining': ['restaurant', 'food', 'dining', 'cafe', 'coffee', 'lunch', 'dinner', 'grocery', 'supermarket', 'grocery store'],
    'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking', 'toll', 'car', 'vehicle'],
    'Shopping': ['store', 'shop', 'mall', 'amazon', 'online', 'purchase', 'buy', 'retail'],
    'Entertainment': ['movie', 'cinema', 'theater', 'game', 'entertainment', 'fun', 'leisure', 'hobby'],
    'Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'cable', 'utility', 'power'],
    'Healthcare': ['doctor', 'medical', 'pharmacy', 'hospital', 'health', 'medicine', 'dental'],
    'Education': ['school', 'education', 'course', 'book', 'learning', 'university', 'college'],
    'Rent & Housing': ['rent', 'mortgage', 'housing', 'apartment', 'home', 'property'],
    'Insurance': ['insurance', 'premium', 'policy', 'coverage'],
    'Personal Care': ['beauty', 'salon', 'gym', 'fitness', 'personal', 'care', 'cosmetics']
  };

  // Common income categories
  const incomeKeywords = {
    'Salary': ['salary', 'wage', 'pay', 'income', 'work', 'job'],
    'Freelance': ['freelance', 'contract', 'consulting', 'gig', 'project'],
    'Investment': ['dividend', 'interest', 'investment', 'return', 'profit'],
    'Business': ['business', 'sales', 'revenue', 'profit', 'income'],
    'Gift': ['gift', 'present', 'bonus', 'reward'],
    'Refund': ['refund', 'return', 'reimbursement', 'rebate']
  };

  const suggestions: Array<{name: string; confidence: number; reason: string}> = [];
  const keywordMap = type === 'expense' ? expenseKeywords : incomeKeywords;

  // Find matching categories
  for (const [category, keywords] of Object.entries(keywordMap)) {
    const matches = keywords.filter(keyword => lowerDesc.includes(keyword));
    if (matches.length > 0) {
      const confidence = Math.min(90, 60 + (matches.length * 10));
      suggestions.push({
        name: category,
        confidence,
        reason: `Matches keywords: ${matches.join(', ')}`
      });
    }
  }

  // Add existing categories if they seem relevant
  for (const existing of existingCategories) {
    if (lowerDesc.includes(existing.toLowerCase()) || 
        existing.toLowerCase().includes(lowerDesc.split(' ')[0])) {
      suggestions.push({
        name: existing,
        confidence: 70,
        reason: 'Matches existing category'
      });
    }
  }

  // Add a "New Category" option if no good matches
  if (suggestions.length === 0 || suggestions[0].confidence < 50) {
    suggestions.push({
      name: 'New Category',
      confidence: 30,
      reason: 'No existing category matches well'
    });
  }

  // Add some randomization to make suggestions more dynamic
  const shuffledSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((s, index) => ({
      ...s,
      confidence: Math.min(95, s.confidence + (Math.random() * 5 - 2.5)) // Add small random variation
    }));

  return shuffledSuggestions;
}
