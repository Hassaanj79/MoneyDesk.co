import { NextRequest, NextResponse } from 'next/server';
import { googleVisionOCR } from '@/services/google-vision-ocr';

export async function GET(request: NextRequest) {
  try {
    const isAvailable = googleVisionOCR.isAvailable();
    
    return NextResponse.json({
      service: 'Google Vision OCR',
      available: isAvailable,
      status: isAvailable ? 'ready' : 'not_configured',
      message: isAvailable 
        ? 'Google Vision API is properly configured and ready to process receipts'
        : 'Google Vision API is not configured. Please check your credentials and environment variables.',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasCredentials: !!(
        process.env.GOOGLE_APPLICATION_CREDENTIALS || 
        process.env.GOOGLE_CLOUD_PROJECT_ID ||
        process.env.GOOGLE_VISION_API_KEY ||
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      )
    });
  } catch (error: any) {
    return NextResponse.json({
      service: 'Google Vision OCR',
      available: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
