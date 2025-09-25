import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is working
    const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // Try to initialize Firebase Admin SDK
    let adminSDKWorking = false;
    let errorMessage = '';
    
    try {
      const { adminAuth } = await import('@/lib/firebase-admin');
      if (adminAuth) {
        // Try to list users (this will fail if credentials are wrong)
        await adminAuth.listUsers(1);
        adminSDKWorking = true;
      }
    } catch (error: any) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasServiceAccountKey,
      hasProjectId,
      adminSDKWorking,
      errorMessage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
