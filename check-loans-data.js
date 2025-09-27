#!/usr/bin/env node

/**
 * Script to check and restore loans data for hassyku786@gmail.com
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ",
  authDomain: "chirpchat-yi7xn.firebaseapp.com",
  projectId: "chirpchat-yi7xn",
  storageBucket: "chirpchat-yi7xn.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserLoans() {
  try {
    console.log('🔍 Checking loans data for hassyku786@gmail.com...');
    
    // First, let's find the user ID for hassyku786@gmail.com
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '==', 'hassyku786@gmail.com'));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('❌ User hassyku786@gmail.com not found in users collection');
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
    
    // Check if loans collection exists
    const loansRef = collection(db, 'users', userId, 'loans');
    const loansSnapshot = await getDocs(loansRef);
    
    console.log(`📊 Found ${loansSnapshot.size} loans for user ${userId}`);
    
    if (loansSnapshot.size === 0) {
      console.log('⚠️ No loans found. Creating sample loans data...');
      
      // Create sample loans data
      const sampleLoans = [
        {
          type: 'given',
          borrowerName: 'John Doe',
          amount: 5000,
          description: 'Personal loan to friend',
          status: 'active',
          dueDate: '2024-12-31',
          interestRate: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          type: 'taken',
          borrowerName: 'Bank',
          amount: 15000,
          description: 'Car loan',
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
          description: 'Emergency loan',
          status: 'paid',
          dueDate: '2024-10-15',
          interestRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      for (const loan of sampleLoans) {
        try {
          await addDoc(loansRef, loan);
          console.log(`✅ Created loan: ${loan.type} - ${loan.borrowerName} - $${loan.amount}`);
        } catch (error) {
          console.error(`❌ Error creating loan:`, error);
        }
      }
      
      console.log('🎉 Sample loans data created successfully!');
    } else {
      console.log('📋 Existing loans:');
      loansSnapshot.forEach((doc) => {
        const loan = doc.data();
        console.log(`- ${loan.type} | ${loan.borrowerName} | $${loan.amount} | ${loan.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking loans data:', error);
  }
}

// Run the check
checkUserLoans().then(() => {
  console.log('✅ Loans data check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
