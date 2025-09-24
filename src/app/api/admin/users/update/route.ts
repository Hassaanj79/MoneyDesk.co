import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { userId, displayName, email, moduleAccess, subscriptionTier, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not available' },
        { status: 500 }
      );
    }

    const updates: any = {};

    // Update Firebase Auth user if displayName or email changed
    if (displayName !== undefined) {
      updates.displayName = displayName;
    }
    if (email !== undefined) {
      updates.email = email;
    }
    if (isActive !== undefined) {
      updates.disabled = !isActive;
    }

    // Update Firebase Auth user
    if (Object.keys(updates).length > 0) {
      await adminAuth.updateUser(userId, updates);
    }

    // Update Firestore user document with module access and subscription info
    const userDocRef = doc(db, 'users', userId);
    const firestoreUpdates: any = {
      updatedAt: new Date().toISOString()
    };

    if (moduleAccess !== undefined) {
      firestoreUpdates.moduleAccess = moduleAccess;
    }
    if (subscriptionTier !== undefined) {
      firestoreUpdates.subscriptionTier = subscriptionTier;
    }
    if (displayName !== undefined) {
      firestoreUpdates.name = displayName;
    }
    if (email !== undefined) {
      firestoreUpdates.email = email;
    }
    if (isActive !== undefined) {
      firestoreUpdates.isActive = isActive;
    }

    // Update Firestore document
    await setDoc(userDocRef, firestoreUpdates, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      userId,
      updates: {
        displayName,
        email,
        moduleAccess,
        subscriptionTier,
        isActive
      }
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
