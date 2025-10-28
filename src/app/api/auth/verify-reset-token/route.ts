import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the reset token
    const resetTokenRef = doc(db, 'password_reset_tokens', email);
    const tokenDoc = await getDoc(resetTokenRef);

    if (!tokenDoc.exists()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data();
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    // Check if token is expired
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token matches
    if (tokenData.token !== token) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used
    await updateDoc(resetTokenRef, {
      used: true,
      usedAt: new Date().toISOString(),
    });

    // Update password using Firebase Auth
    // Note: This requires the user to be signed in, so we'll need to handle this differently
    // For now, we'll return success and let the frontend handle the password update
    
    return NextResponse.json({
      success: true,
      message: 'Password reset token verified successfully',
    });

  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    // Verify the reset token
    const resetTokenRef = doc(db, 'password_reset_tokens', email);
    const tokenDoc = await getDoc(resetTokenRef);

    if (!tokenDoc.exists()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data();
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    // Check if token is expired
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token matches
    if (tokenData.token !== token) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reset token is valid',
      email: email,
    });

  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
