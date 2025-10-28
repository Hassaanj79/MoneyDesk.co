import { NextRequest, NextResponse } from 'next/server';
import { clientOCR } from '@/services/client-ocr';

export async function GET(request: NextRequest) {
  try {
    // Note: OCR availability can only be checked on the client side
    // This API route runs on the server where Tesseract.js is not available
    
    return NextResponse.json({
      success: true,
      ocrAvailable: 'client-side-only',
      service: 'Client-side OCR (Tesseract.js)',
      timestamp: new Date().toISOString(),
      message: 'OCR runs in the browser. Use the OCR test page to verify functionality.',
      note: 'Tesseract.js is installed and ready for client-side use'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      service: 'Client-side OCR (Tesseract.js)',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({
        success: false,
        error: 'No image data provided'
      }, { status: 400 });
    }

    // Test OCR processing
    const result = await clientOCR.extractTextFromImage(imageData);

    return NextResponse.json({
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        processingTime: result.processingTime
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'OCR processing failed'
    }, { status: 500 });
  }
}
