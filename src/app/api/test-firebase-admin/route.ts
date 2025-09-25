import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK...');
    
    // Log environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_SERVICE_ACCOUNT_KEY_EXISTS: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
      adminAuthAvailable: !!adminAuth,
    };
    
    console.log('Environment info:', envInfo);
    
    if (!adminAuth) {
      return NextResponse.json({
        success: false,
        message: 'Firebase Admin SDK not available',
        envInfo,
        error: 'adminAuth is null or undefined'
      });
    }
    
    // Test Firebase Admin SDK by trying to list users
    try {
      const listUsersResult = await adminAuth.listUsers(5); // Get only 5 users for testing
      
      return NextResponse.json({
        success: true,
        message: 'Firebase Admin SDK is working correctly',
        envInfo,
        testResult: {
          userCount: listUsersResult.users.length,
          hasMore: !!listUsersResult.pageToken,
          sampleUsers: listUsersResult.users.slice(0, 2).map(user => ({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            disabled: user.disabled
          }))
        }
      });
      
    } catch (authError: any) {
      console.error('Firebase Admin Auth error:', authError);
      
      return NextResponse.json({
        success: false,
        message: 'Firebase Admin SDK initialized but auth operations failed',
        envInfo,
        error: authError.message,
        errorCode: authError.code
      });
    }
    
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message,
      stack: error.stack
    });
  }
}
