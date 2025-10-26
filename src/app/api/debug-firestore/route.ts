import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // Try to initialize with service account from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'moneydesk-ai'
      });
    } else {
      // Fallback to default credentials (for local development)
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'moneydesk-ai'
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

const db = getFirestore();
const auth = getAuth();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging Firestore Permissions...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Total users in database: ${usersSnapshot.size}`);

    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No users found in database',
        message: 'Please log in first to create a user profile',
        users: []
      });
    }

    const users = [];
    const userDetails = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      users.push({
        id: userId,
        email: userData.email || 'No email',
        createdAt: userData.createdAt?.toDate?.() || 'Unknown'
      });

      // Get user details
      const userDetail = {
        userId,
        email: userData.email || 'No email',
        transactions: 0,
        accounts: 0,
        categories: 0
      };

      try {
        // Check transactions
        const transactionsSnapshot = await db.collection('users').doc(userId).collection('transactions').get();
        userDetail.transactions = transactionsSnapshot.size;

        // Check accounts
        const accountsSnapshot = await db.collection('users').doc(userId).collection('accounts').get();
        userDetail.accounts = accountsSnapshot.size;

        // Check categories
        const categoriesSnapshot = await db.collection('users').doc(userId).collection('categories').get();
        userDetail.categories = categoriesSnapshot.size;

      } catch (error) {
        console.error(`Error accessing data for user ${userId}:`, error.message);
        userDetail.error = error.message;
      }

      userDetails.push(userDetail);
    }

    return NextResponse.json({
      success: true,
      totalUsers: usersSnapshot.size,
      users,
      userDetails,
      message: 'Firestore data retrieved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error debugging Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to debug Firestore permissions'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();
    
    if (action === 'fix-user-data') {
      console.log(`🔧 Fixing user data structure for: ${userId}`);

      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 });
      }

      // Ensure user document exists
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return NextResponse.json({
          success: false,
          error: 'User document does not exist'
        }, { status: 404 });
      }

      const userData = userDoc.data()!;

      // Update user document
      await userRef.set({
        ...userData,
        userId: userId,
        updatedAt: new Date()
      }, { merge: true });

      // Check and create default account if needed
      const accountsSnapshot = await db.collection('users').doc(userId).collection('accounts').get();
      
      if (accountsSnapshot.empty) {
        await db.collection('users').doc(userId).collection('accounts').add({
          name: 'Default Account',
          type: 'checking',
          balance: 0,
          initialBalance: 0,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Check and create default categories if needed
      const categoriesSnapshot = await db.collection('users').doc(userId).collection('categories').get();
      
      if (categoriesSnapshot.empty) {
        const defaultCategories = [
          { name: 'Food & Dining', type: 'expense', color: '#FF6B6B' },
          { name: 'Transportation', type: 'expense', color: '#4ECDC4' },
          { name: 'Shopping', type: 'expense', color: '#45B7D1' },
          { name: 'Entertainment', type: 'expense', color: '#96CEB4' },
          { name: 'Bills & Utilities', type: 'expense', color: '#FFEAA7' },
          { name: 'Healthcare', type: 'expense', color: '#DDA0DD' },
          { name: 'Salary', type: 'income', color: '#98D8C8' },
          { name: 'Freelance', type: 'income', color: '#F7DC6F' },
          { name: 'Investment', type: 'income', color: '#BB8FCE' }
        ];

        for (const category of defaultCategories) {
          await db.collection('users').doc(userId).collection('categories').add({
            ...category,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'User data structure fixed successfully'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error fixing user data:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to fix user data structure'
    }, { status: 500 });
  }
}
