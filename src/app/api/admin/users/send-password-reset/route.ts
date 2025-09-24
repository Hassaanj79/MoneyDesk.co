import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not available' },
        { status: 500 }
      );
    }

    // Check if user exists
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      
      // Configure Firebase Auth email settings
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/reset-password`,
        handleCodeInApp: true,
      };

      // Generate password reset link
      const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      
      // Note: Firebase Admin SDK doesn't automatically send emails
      // The email needs to be sent through Firebase Auth's built-in email service
      // This can be configured in the Firebase Console under Authentication > Templates
      
      console.log('Password reset link generated for:', email);
      console.log('Reset link:', resetLink);
      
      return NextResponse.json({
        success: true,
        message: 'Password reset link generated successfully',
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
