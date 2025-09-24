import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, disabled } = await request.json();

    if (!userId || typeof disabled !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and disabled status are required' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not available' },
        { status: 500 }
      );
    }

    // Update user disabled status
    await adminAuth.updateUser(userId, {
      disabled: disabled
    });

    return NextResponse.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      userId,
      disabled
    });

  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user status' },
      { status: 500 }
    );
  }
}
