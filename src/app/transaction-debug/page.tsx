"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useTransactions } from '@/contexts/transaction-context';
import { useAuth } from '@/contexts/auth-context';

export default function TransactionDebugTest() {
  const { transactions, addTransaction, loading } = useTransactions();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testAddTransaction = async () => {
    if (!user) {
      setTestResults({ success: false, error: 'User not authenticated' });
      return;
    }

    setIsAdding(true);
    try {
      console.log('🧪 Testing transaction addition...');
      
      const testTransaction = {
        type: 'expense' as const,
        name: 'Test Receipt Transaction',
        amount: 15.99,
        date: new Date(),
        accountId: 'test-account', // This might need to be a real account ID
        categoryId: 'test-category', // This might need to be a real category ID
        isRecurring: false
      };

      console.log('📝 Adding transaction:', testTransaction);
      const result = await addTransaction(testTransaction);
      console.log('✅ Transaction added successfully:', result);

      setTestResults({
        success: true,
        message: 'Transaction added successfully!',
        transactionId: result
      });

      // Wait a moment for Firestore listener to update
      setTimeout(() => {
        console.log('📊 Current transactions after addition:', transactions.length);
        setTestResults(prev => ({
          ...prev,
          transactionsCount: transactions.length,
          latestTransaction: transactions[0]
        }));
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error adding transaction:', error);
      setTestResults({
        success: false,
        error: error.message || 'Failed to add transaction'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const refreshTransactions = () => {
    console.log('🔄 Refreshing transactions...');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔧 Transaction Debug Test
          </h1>
          <p className="text-xl text-gray-600">
            Test transaction addition and display functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Test Controls
              </CardTitle>
              <CardDescription>
                Test transaction addition and verify it appears in the list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Authentication Status:</h4>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? `✅ Logged in as ${user.email}` : '❌ Not authenticated'}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Current Transactions:</h4>
                <Badge variant="outline">
                  {loading ? 'Loading...' : `${transactions.length} transactions`}
                </Badge>
              </div>

              <Button 
                onClick={testAddTransaction}
                disabled={isAdding || !user}
                className="w-full"
              >
                {isAdding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Test Add Transaction'
                )}
              </Button>

              <Button 
                onClick={refreshTransactions}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>

              {isAdding && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding transaction...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Test Results
              </CardTitle>
              <CardDescription>
                View the results of your tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={testResults.success ? "default" : "destructive"}>
                      {testResults.success ? "✅ Success" : "❌ Failed"}
                    </Badge>
                    {testResults.transactionsCount !== undefined && (
                      <Badge variant="outline">
                        {testResults.transactionsCount} transactions
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {testResults.message || testResults.error}
                  </div>

                  {testResults.transactionId && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium">Transaction ID:</div>
                      <div className="text-xs text-gray-600 font-mono">
                        {testResults.transactionId}
                      </div>
                    </div>
                  )}

                  {testResults.latestTransaction && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium">Latest Transaction:</div>
                      <div className="text-xs text-gray-600">
                        {testResults.latestTransaction.name} - ${testResults.latestTransaction.amount}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <strong>Debug Info:</strong> Check browser console for detailed logs
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No test results yet. Run a test to see the results!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Current Transactions</CardTitle>
            <CardDescription>
              All transactions currently loaded in the context
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading transactions...</span>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type}
                      </Badge>
                      <span className="text-sm font-medium">{transaction.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${transaction.amount} - {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {transactions.length > 10 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... and {transactions.length - 10} more transactions
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No transactions found</p>
                <p className="text-sm">Make sure you're logged in and have some transactions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Check Authentication</h3>
                <p className="text-sm text-gray-600">
                  Make sure you're logged in. The transaction context requires authentication to work.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Test Transaction Addition</h3>
                <p className="text-sm text-gray-600">
                  Click "Test Add Transaction" to add a sample transaction and see if it appears in the list.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Check Browser Console</h3>
                <p className="text-sm text-gray-600">
                  Open your browser's developer console (F12) to see detailed logs of the transaction process.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">4. Verify Firestore Listener</h3>
                <p className="text-sm text-gray-600">
                  The Firestore listener should automatically update the transactions list when new transactions are added.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
