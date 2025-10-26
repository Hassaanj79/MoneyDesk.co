"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, User, Database, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTransactions } from '@/contexts/transaction-context';
import { useAccounts } from '@/contexts/account-context';
import { useCategories } from '@/contexts/category-context';
import { toast } from 'sonner';

export default function FirestoreDebugPage() {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [isFixing, setIsFixing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setDebugInfo({
        userId: user.uid,
        email: user.email,
        transactionsCount: transactions.length,
        accountsCount: accounts.length,
        categoriesCount: categories.length,
        transactionsLoading,
        accountsLoading,
        categoriesLoading
      });
    }
  }, [user, transactions, accounts, categories, transactionsLoading, accountsLoading, categoriesLoading]);

  const fixUserData = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setIsFixing(true);
    try {
      // Call the debug API to fix user data
      const response = await fetch('/api/debug-firestore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fix-user-data',
          userId: user.uid
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('User data structure fixed successfully!');
        // Refresh the page to reload contexts
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to fix user data');
      }
    } catch (error: any) {
      console.error('Error fixing user data:', error);
      toast.error('Failed to fix user data: ' + error.message);
    } finally {
      setIsFixing(false);
    }
  };

  const refreshData = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔧 Firestore Debug & Fix
          </h1>
          <p className="text-xl text-gray-600">
            Debug and fix Firestore permissions and data structure issues
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <Badge variant="default" className="text-green-600 bg-green-100">
                  ✅ Authenticated
                </Badge>
                <div className="text-sm text-gray-600">
                  <strong>User ID:</strong> {user.uid}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Email:</strong> {user.email}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive">
                  ❌ Not Authenticated
                </Badge>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please log in first to access Firestore data. Go to{' '}
                    <a href="/login" className="text-blue-600 underline">
                      /login
                    </a>{' '}
                    to sign in.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Status */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-500" />
                Data Status
              </CardTitle>
              <CardDescription>
                Current state of your Firestore data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Transactions</h4>
                  <Badge variant={transactionsLoading ? "secondary" : transactions.length > 0 ? "default" : "destructive"}>
                    {transactionsLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      transactions.length
                    )}
                    {' '}transactions
                  </Badge>
                  {transactionsLoading && (
                    <div className="text-xs text-gray-500">Loading...</div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Accounts</h4>
                  <Badge variant={accountsLoading ? "secondary" : accounts.length > 0 ? "default" : "destructive"}>
                    {accountsLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      accounts.length
                    )}
                    {' '}accounts
                  </Badge>
                  {accountsLoading && (
                    <div className="text-xs text-gray-500">Loading...</div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Categories</h4>
                  <Badge variant={categoriesLoading ? "secondary" : categories.length > 0 ? "default" : "destructive"}>
                    {categoriesLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      categories.length
                    )}
                    {' '}categories
                  </Badge>
                  {categoriesLoading && (
                    <div className="text-xs text-gray-500">Loading...</div>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Debug Information:</h5>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                Actions
              </CardTitle>
              <CardDescription>
                Fix data structure issues and refresh data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={fixUserData}
                  disabled={isFixing}
                  className="flex-1"
                >
                  {isFixing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Fix User Data Structure
                </Button>

                <Button 
                  onClick={refreshData}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fix User Data Structure:</strong> This will ensure you have the required accounts and categories 
                  needed for transactions to work properly. It's safe to run multiple times.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Authentication Issues</h3>
                <p className="text-sm text-gray-600">
                  If you see "Missing or insufficient permissions", make sure you're logged in. 
                  The Firestore rules require authentication to access user data.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Missing Data Structure</h3>
                <p className="text-sm text-gray-600">
                  If you have 0 accounts or categories, click "Fix User Data Structure" to create 
                  the default accounts and categories needed for transactions.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Firestore Rules</h3>
                <p className="text-sm text-gray-600">
                  The Firestore rules allow users to access only their own data. Make sure you're 
                  logged in with the correct account that owns the data.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">4. Browser Console</h3>
                <p className="text-sm text-gray-600">
                  Open your browser's developer console (F12) to see detailed error messages 
                  and debug information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
