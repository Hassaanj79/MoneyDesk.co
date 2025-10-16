import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDocs, query, collection, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all accounts for the user
    const accountsSnapshot = await getDocs(query(collection(db, 'users', userId, 'accounts')));
    const accountsData: Record<string, { initialBalance: number }> = {};
    
    accountsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      accountsData[docSnapshot.id] = { initialBalance: data.initialBalance || 0 };
    });

    // Get all transactions for the user
    const transactionsSnapshot = await getDocs(query(collection(db, 'users', userId, 'transactions')));
    const transactions: any[] = [];
    
    transactionsSnapshot.forEach((docSnapshot) => {
      transactions.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Group transactions by account
    const accountTransactionsMap = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.accountId]) {
        acc[transaction.accountId] = [];
      }
      acc[transaction.accountId].push(transaction);
      return acc;
    }, {} as Record<string, any[]>);

    // Recalculate balance for each account
    const results = [];
    for (const [accountId, accountTransactions] of Object.entries(accountTransactionsMap)) {
      const initialBalance = accountsData[accountId]?.initialBalance || 0;
      const balance = accountTransactions.reduce((sum: number, transaction: any) => {
        const positiveAmount = Math.abs(transaction.amount);
        return sum + (transaction.type === 'income' ? positiveAmount : -positiveAmount);
      }, initialBalance);

      await updateDoc(doc(db, 'users', userId, 'accounts', accountId), { balance });
      results.push({ accountId, balance, transactionCount: accountTransactions.length });
    }

    // Handle accounts with no transactions (set balance to initial balance)
    for (const [accountId, accountData] of Object.entries(accountsData)) {
      if (!accountTransactionsMap[accountId]) {
        await updateDoc(doc(db, 'users', userId, 'accounts', accountId), { balance: accountData.initialBalance });
        results.push({ accountId, balance: accountData.initialBalance, transactionCount: 0 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account balances recalculated successfully',
      results 
    });

  } catch (error) {
    console.error('Error recalculating balances:', error);
    return NextResponse.json({ error: 'Failed to recalculate balances' }, { status: 500 });
  }
}
