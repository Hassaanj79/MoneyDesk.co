import { NextRequest, NextResponse } from 'next/server';
import { googleVisionOCR } from '@/services/google-vision-ocr';

export async function POST(request: NextRequest) {
  try {
    // Check if Google Vision API is available
    if (!googleVisionOCR.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Google Vision API is not configured. Please check your credentials.'
      }, { status: 503 });
    }

    // Parse the request body
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({
        success: false,
        error: 'No image data provided'
      }, { status: 400 });
    }

    // Convert base64 image data to buffer
    let imageBuffer: Buffer;
    try {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image data format'
      }, { status: 400 });
    }

    // Validate image size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Image too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    // Process the receipt image
    const result = await googleVisionOCR.processReceipt(imageBuffer);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process receipt'
      }, { status: 500 });
    }

    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error('Receipt processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error while processing receipt'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const isAvailable = googleVisionOCR.isAvailable();
    
    return NextResponse.json({
      available: isAvailable,
      service: 'Google Vision OCR',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      available: false,
      error: error.message,
      service: 'Google Vision OCR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
