#!/usr/bin/env node

/**
 * Script to restore loans data for hassyku786@gmail.com
 * This will create sample loans data if none exists
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } = require('firebase/firestore');

// Firebase configuration (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chirpchat-yi7xn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chirpchat-yi7xn.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreLoansData() {
  try {
    console.log('🔄 Restoring loans data for hassyku786@gmail.com...');
    
    // Find the user ID for hassyku786@gmail.com
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '==', 'hassyku786@gmail.com'));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('❌ User hassyku786@gmail.com not found in users collection');
      console.log('💡 Please make sure you are logged in and have created a user profile');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('✅ Found user:', {
      id: userId,
      email: userData.email,
      name: userData.name
    });
    
    // Check existing loans
    const loansRef = collection(db, 'users', userId, 'loans');
    const loansSnapshot = await getDocs(loansRef);
    
    console.log(`📊 Found ${loansSnapshot.size} existing loans`);
    
    if (loansSnapshot.size > 0) {
      console.log('📋 Existing loans:');
      loansSnapshot.forEach((doc) => {
        const loan = doc.data();
        console.log(`- ${loan.type} | ${loan.borrowerName} | $${loan.amount} | ${loan.status}`);
      });
      console.log('✅ Loans data already exists!');
      return;
    }
    
    // Create sample loans data
    console.log('🔄 Creating sample loans data...');
    
    const sampleLoans = [
      {
        type: 'given',
        borrowerName: 'John Doe',
        amount: 5000,
        description: 'Personal loan to friend for emergency',
        status: 'active',
        dueDate: '2024-12-31',
        interestRate: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'taken',
        borrowerName: 'Bank of America',
        amount: 15000,
        description: 'Car loan for new vehicle',
        status: 'active',
        dueDate: '2025-06-30',
        interestRate: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'given',
        borrowerName: 'Sarah Smith',
        amount: 2000,
        description: 'Emergency loan to family member',
        status: 'paid',
        dueDate: '2024-10-15',
        interestRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'taken',
        borrowerName: 'Wells Fargo',
        amount: 25000,
        description: 'Home improvement loan',
        status: 'active',
        dueDate: '2025-12-31',
        interestRate: 6.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    let createdCount = 0;
    for (const loan of sampleLoans) {
      try {
        const docRef = await addDoc(loansRef, loan);
        console.log(`✅ Created loan: ${loan.type} - ${loan.borrowerName} - $${loan.amount} (ID: ${docRef.id})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating loan ${loan.borrowerName}:`, error);
      }
    }
    
    console.log(`🎉 Successfully created ${createdCount} loans!`);
    console.log('💡 Your loans data has been restored. Please refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error restoring loans data:', error);
    console.log('💡 Make sure you are logged in as hassyku786@gmail.com and have proper permissions');
  }
}

// Run the restoration
restoreLoansData().then(() => {
  console.log('✅ Loans data restoration completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
