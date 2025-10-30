import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Check if verification token exists and is valid
    const verificationDoc = await adminDb
      .collection('email_verifications')
      .doc(token)
      .get();

    if (!verificationDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const verificationData = verificationDoc.data();
    
    // Check if token is for the correct email
    if (verificationData?.email !== email) {
      return NextResponse.json(
        { error: 'Invalid verification token for this email' },
        { status: 400 }
      );
    }

    // Check if token has expired (24 hours)
    const tokenCreatedAt = verificationData?.createdAt?.toDate();
    const now = new Date();
    const hoursDiff = (now.getTime() - tokenCreatedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      // Delete expired token
      await adminDb.collection('email_verifications').doc(token).delete();
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get the user by email
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (error) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's email verification status
    await adminAuth.updateUser(user.uid, {
      emailVerified: true
    });

    // Delete the verification token
    await adminDb.collection('email_verifications').doc(token).delete();

    console.log(`✅ Email verified for user: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });

  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}


