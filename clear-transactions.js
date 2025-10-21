const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account-key.json not found!');
  console.log('Please make sure the Firebase service account key file is in the project root.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneydesk-ai-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function clearAllTransactions() {
  try {
    console.log('🗑️  Starting to clear all transactions...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('ℹ️  No users found in the database.');
      return;
    }
    
    let totalDeleted = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Processing user: ${userId}`);
      
      // Get all transactions for this user
      const transactionsSnapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .get();
      
      if (transactionsSnapshot.empty) {
        console.log(`   No transactions found for user ${userId}`);
        continue;
      }
      
      console.log(`   Found ${transactionsSnapshot.size} transactions for user ${userId}`);
      
      // Delete all transactions in batches
      const batch = db.batch();
      let batchCount = 0;
      
      transactionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        batchCount++;
        totalDeleted++;
        
        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          batch.commit();
          batchCount = 0;
        }
      });
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`   ✅ Deleted ${transactionsSnapshot.size} transactions for user ${userId}`);
    }
    
    console.log(`\n🎉 Successfully deleted ${totalDeleted} transactions from all users!`);
    
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
clearAllTransactions();
