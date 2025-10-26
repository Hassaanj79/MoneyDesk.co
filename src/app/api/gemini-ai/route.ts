import { NextRequest, NextResponse } from 'next/server';
import { firebaseGemini } from '@/services/firebase-gemini';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Gemini is available
    if (!firebaseGemini.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Gemini is not configured. Please check your Firebase AI Logic setup.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'category-suggestions':
        return await handleCategorySuggestions(data);
      
      case 'spending-analysis':
        return await handleSpendingAnalysis(data);
      
      case 'duplicate-detection':
        return await handleDuplicateDetection(data);
      
      case 'receipt-parsing':
        return await handleReceiptParsing(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error while processing Gemini request'
    }, { status: 500 });
  }
}

async function handleCategorySuggestions(data: any) {
  const { transactionName, amount, existingCategories } = data;

  if (!transactionName || !amount || !existingCategories) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: transactionName, amount, existingCategories'
    }, { status: 400 });
  }

  try {
    const suggestions = await firebaseGemini.getCategorySuggestions(
      transactionName,
      amount,
      existingCategories
    );

    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get category suggestions'
    }, { status: 500 });
  }
}

async function handleSpendingAnalysis(data: any) {
  const { transactions, timeRange } = data;

  if (!transactions || !Array.isArray(transactions)) {
    return NextResponse.json({
      success: false,
      error: 'Missing or invalid transactions array'
    }, { status: 400 });
  }

  try {
    const analysis = await firebaseGemini.generateSpendingAnalysis(
      transactions,
      timeRange || 'last 30 days'
    );

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate spending analysis'
    }, { status: 500 });
  }
}

async function handleDuplicateDetection(data: any) {
  const { newTransaction, existingTransactions } = data;

  if (!newTransaction || !existingTransactions) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: newTransaction, existingTransactions'
    }, { status: 400 });
  }

  try {
    const result = await firebaseGemini.detectDuplicates(
      newTransaction,
      existingTransactions
    );

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to detect duplicates'
    }, { status: 500 });
  }
}

async function handleReceiptParsing(data: any) {
  const { receiptText } = data;

  if (!receiptText) {
    return NextResponse.json({
      success: false,
      error: 'Missing required field: receiptText'
    }, { status: 400 });
  }

  try {
    const receiptData = await firebaseGemini.processReceiptWithGemini(receiptText);

    return NextResponse.json({
      success: true,
      data: receiptData
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse receipt'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const isAvailable = firebaseGemini.isAvailable();
    const modelInfo = firebaseGemini.getModelInfo();
    
    return NextResponse.json({
      available: isAvailable,
      service: 'Firebase Gemini AI',
      model: modelInfo.name,
      timestamp: new Date().toISOString(),
      features: [
        'receipt-parsing',
        'category-suggestions', 
        'spending-analysis',
        'duplicate-detection'
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      available: false,
      error: error.message,
      service: 'Firebase Gemini AI',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
