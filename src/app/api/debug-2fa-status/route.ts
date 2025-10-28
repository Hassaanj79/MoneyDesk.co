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

    // Check 2FA status
    const user2FARef = doc(db, 'user_2fa', userId);
    const docSnap = await getDoc(user2FARef);
    
    console.log('📄 Document exists:', docSnap.exists());
    
    if (!docSnap.exists()) {
      return NextResponse.json({
        success: true,
        enabled: false,
        message: '2FA document does not exist',
        userId: userId
      });
    }

    const data = docSnap.data();
    console.log('📄 Document data:', data);

    return NextResponse.json({
      success: true,
      enabled: data.enabled === true,
      message: `2FA is ${data.enabled ? 'enabled' : 'disabled'}`,
      userId: userId,
      data: data
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
