import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking 2FA status for user:', userId);

    // First try with the provided userId (Firebase UID)
    const user2FARef = doc(db, 'user_2fa', userId);
    const docSnap = await getDoc(user2FARef);
    
    console.log('📄 Document exists with UID:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('📄 Document data:', data);
      
      return NextResponse.json({
        success: true,
        enabled: data.enabled === true,
        message: `2FA is ${data.enabled ? 'enabled' : 'disabled'}`,
        userId: userId,
        data: data,
        foundWith: 'uid'
      });
    }

    // If not found with UID, try to extract email from userId if it looks like an email
    if (userId.includes('@')) {
      const email2FARef = doc(db, 'user_2fa', userId);
      const emailDocSnap = await getDoc(email2FARef);
      
      console.log('📄 Document exists with email:', emailDocSnap.exists());
      
      if (emailDocSnap.exists()) {
        const data = emailDocSnap.data();
        console.log('📄 Document data:', data);
        
        return NextResponse.json({
          success: true,
          enabled: data.enabled === true,
          message: `2FA is ${data.enabled ? 'enabled' : 'disabled'}`,
          userId: userId,
          data: data,
          foundWith: 'email'
        });
      }
    }

    return NextResponse.json({
      success: true,
      enabled: false,
      message: '2FA document does not exist',
      userId: userId,
      foundWith: 'none'
    });
  } catch (error: any) {
    console.error('❌ Error checking 2FA status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check 2FA status',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
