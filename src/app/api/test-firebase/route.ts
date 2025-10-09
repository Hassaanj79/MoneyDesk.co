import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic Firebase configuration
    const config = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chirpchat-yi7xn.firebaseapp.com",
    };
    
    console.log('Firebase config:', config);
    
    // Test Firestore access with a simple read
    try {
      // Try to read a document that should exist (or at least not cause permission errors)
      // Use a public collection that doesn't require authentication
      const testDocRef = doc(db, 'categories', 'test');
      const testDoc = await getDoc(testDocRef);
      
      return NextResponse.json({
        success: true,
        message: 'Firebase connection successful',
        config,
        firestoreTest: {
          success: true,
          documentExists: testDoc.exists(),
          data: testDoc.data()
        }
      });
    } catch (firestoreError: any) {
      console.error('Firestore test failed:', firestoreError);
      
      return NextResponse.json({
        success: false,
        message: 'Firebase connection failed',
        config,
        error: {
          code: firestoreError.code,
          message: firestoreError.message,
          stack: firestoreError.stack
        },
        firestoreTest: {
          success: false,
          error: firestoreError.message
        }
      });
    }
  } catch (error: any) {
    console.error('Firebase test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Firebase test failed',
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
