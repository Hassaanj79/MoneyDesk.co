import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not available' },
        { status: 500 }
      );
    }

    // Check if user exists first
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      
      // Configure Firebase Auth email settings
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/reset-password`,
        handleCodeInApp: true,
      };

      // Generate password reset link using Firebase Admin SDK
      // Note: Firebase Admin SDK generates the link but doesn't automatically send emails
      // To use Firebase's native email sending, you need to:
      // 1. Configure email templates in Firebase Console (Authentication > Templates)
      // 2. Use the client-side sendPasswordResetEmail method
      // 3. Or integrate with Firebase's email service through the console
      
      const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      
      console.log('Password reset link generated for:', email);
      console.log('Reset link:', resetLink);
      
      // For now, we'll return the link and log it
      // In production, you would configure Firebase to send emails automatically
      // or use the client-side sendPasswordResetEmail method
      
      return NextResponse.json({
        success: true,
        message: 'Password reset link generated successfully. Configure Firebase email templates to send emails automatically.',
        email: email,
        resetLink: resetLink
      });
      
    } catch (userError: any) {
      if (userError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'No user found with this email address' },
          { status: 404 }
        );
      }
      throw userError;
    }

  } catch (error: any) {
    console.error('Error generating password reset link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate password reset link' },
      { status: 500 }
    );
  }
}
