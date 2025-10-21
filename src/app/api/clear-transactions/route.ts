import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️  Starting to clear all transactions...');
    
    // Get all transactions
    const transactionsRef = collection(db, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    
    if (transactionsSnapshot.empty) {
      console.log('ℹ️  No transactions found in the database.');
      return NextResponse.json({ 
        success: true, 
        message: 'No transactions found to delete',
        deletedCount: 0 
      });
    }
    
    console.log(`Found ${transactionsSnapshot.size} transactions to delete`);
    
    // Delete all transactions
    const deletePromises = transactionsSnapshot.docs.map(async (transactionDoc) => {
      try {
        await deleteDoc(doc(db, 'transactions', transactionDoc.id));
        console.log(`Deleted transaction: ${transactionDoc.id}`);
        return true;
      } catch (error) {
        console.error(`Error deleting transaction ${transactionDoc.id}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;
    
    console.log(`✅ Successfully deleted ${successCount} transactions`);
    if (failureCount > 0) {
      console.log(`❌ Failed to delete ${failureCount} transactions`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${successCount} transactions`,
      deletedCount: successCount,
      failedCount: failureCount
    });
    
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
