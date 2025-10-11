#!/usr/bin/env node

/**
 * Script to enable all modules for all users
 * This will give all users access to all modules including loans
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'chirpchat-yi7xn'
});

const db = admin.firestore();

// Define full module access for all users
const fullModuleAccess = {
  dashboard: true,
  transactions: true,
  loans: true,
  reports: true,
  settings: true,
  accounts: true,
  budgets: true,
  categories: true,
};

async function enableAllModulesForAllUsers() {
  try {
    console.log('🚀 Starting bulk module access update...');
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`👤 Processing user: ${userData.email || userId}`);
        
        // Update user's subscription with full module access
        const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
        
        await subscriptionRef.set({
          tier: 'premium',
          status: 'active',
          features: fullModuleAccess,
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ Updated ${userData.email || userId} - All modules enabled`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error updating user ${userData.email || userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Bulk update completed!');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('\n📋 All users now have access to:');
    console.log('   • Dashboard');
    console.log('   • Transactions');
    console.log('   • Loans (now enabled!)');
    console.log('   • Reports');
    console.log('   • Settings');
    console.log('   • Accounts');
    console.log('   • Budgets');
    console.log('   • Categories');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
enableAllModulesForAllUsers();
