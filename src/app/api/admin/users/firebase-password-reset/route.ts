import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Configure Firebase Auth email settings
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/reset-password`,
      handleCodeInApp: true,
    };

    // Use Firebase's native password reset email sending
    // This will automatically send the email using Firebase's built-in email service
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    console.log('Password reset email sent via Firebase to:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully via Firebase',
      email: email
    });

  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'No user found with this email address' },
        { status: 404 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/too-many-requests') {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
