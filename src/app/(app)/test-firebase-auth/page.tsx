"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TestFirebaseAuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testFirestoreAccess = async () => {
    if (!user) {
      setTestResult({ success: false, error: 'No user authenticated' });
      return;
    }

    setTesting(true);
    try {
      // Test reading a user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      setTestResult({
        success: true,
        message: 'Firestore access successful',
        userDoc: {
          exists: userDoc.exists(),
          data: userDoc.data()
        }
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
        code: error.code
      });
    } finally {
      setTesting(false);
    }
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Auth Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <Badge variant="default">✅ Authenticated</Badge>
              <div>Email: {user.email}</div>
              <div>UID: {user.uid}</div>
              <div>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <Badge variant="destructive">❌ Not authenticated</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firestore Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testFirestoreAccess} 
            disabled={!user || testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Firestore Access'}
          </Button>

          {testResult && (
            <div>
              <h3 className="font-semibold mb-2">Test Result:</h3>
              {testResult.success ? (
                <Alert>
                  <AlertDescription>
                    ✅ {testResult.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    ❌ {testResult.error}
                    {testResult.code && <div>Code: {testResult.code}</div>}
                  </AlertDescription>
                </Alert>
              )}
              
              {testResult.userDoc && (
                <div className="mt-4">
                  <h4 className="font-semibold">User Document:</h4>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(testResult.userDoc, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
