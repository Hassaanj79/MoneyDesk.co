import { NextRequest, NextResponse } from 'next/server';
import { aiCategorySuggestionsService } from '@/services/ai-category-suggestions';

export async function POST(request: NextRequest) {
  try {
    const { transactionName, transactionType, existingCategories } = await request.json();

    if (!transactionName || !transactionType) {
      return NextResponse.json(
        { error: 'Transaction name and type are required' },
        { status: 400 }
      );
    }

    if (!['income', 'expense'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'Transaction type must be income or expense' },
        { status: 400 }
      );
    }

    const suggestions = await aiCategorySuggestionsService.getCategorySuggestions(
      transactionName,
      transactionType,
      existingCategories || []
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error in category suggestions API:', error);
    return NextResponse.json(
      { error: 'Failed to get category suggestions' },
      { status: 500 }
    );
  }
}