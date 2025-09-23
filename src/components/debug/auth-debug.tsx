"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { testFirebaseConnection, testFirebaseReachability } from '@/lib/firebase-test';

export function AuthDebug() {
  const { login, user, loading } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [firebaseTest, setFirebaseTest] = useState<any>(null);
  const [reachabilityTest, setReachabilityTest] = useState<boolean | null>(null);

  useEffect(() => {
    // Check Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
      authDomain: "chirpchat-yi7xn.firebaseapp.com",
      projectId: "chirpchat-yi7xn",
      storageBucket: "chirpchat-yi7xn.appspot.com",
      messagingSenderId: "786711867654",
      appId: "1:786711867654:web:a845ace12b0f9c526c2e87"
    };

    setDebugInfo({
      firebaseConfig,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleTestLogin = async () => {
    setTestLoading(true);
    setError(null);

    try {
      console.log('Testing login with:', testEmail);
      const result = await login(testEmail, testPassword);
      console.log('Login test successful:', result);
    } catch (err: any) {
      console.error('Login test failed:', err);
      setError(`${err.code}: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const checkNetworkConnectivity = async () => {
    try {
      const response = await fetch('https://www.google.com', { mode: 'no-cors' });
      console.log('Network connectivity check:', response);
      return 'Network is accessible';
    } catch (err) {
      console.error('Network connectivity error:', err);
      return 'Network connectivity issue';
    }
  };

  const testFirebaseConnectionHandler = async () => {
    try {
      const result = await testFirebaseConnection();
      setFirebaseTest(result);
      console.log('Firebase connection test result:', result);
    } catch (err) {
      console.error('Firebase connection test error:', err);
      setFirebaseTest({ success: false, error: err });
    }
  };

  const testFirebaseReachabilityHandler = async () => {
    try {
      const result = await testFirebaseReachability();
      setReachabilityTest(result);
      console.log('Firebase reachability test result:', result);
    } catch (err) {
      console.error('Firebase reachability test error:', err);
      setReachabilityTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Panel</CardTitle>
          <CardDescription>
            Debug Firebase authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Auth State */}
          <div className="space-y-2">
            <h3 className="font-semibold">Current Auth State</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User ID:</strong> {user?.uid || 'N/A'}</p>
              <p><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Firebase Configuration */}
          <div className="space-y-2">
            <h3 className="font-semibold">Firebase Configuration</h3>
            <div className="p-3 bg-gray-100 rounded text-sm">
              <pre>{JSON.stringify(debugInfo?.firebaseConfig, null, 2)}</pre>
            </div>
          </div>

          {/* Test Login */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test Login</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Test email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                type="password"
                placeholder="Test password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleTestLogin}
                disabled={testLoading}
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test Login'
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug Information */}
          <div className="space-y-2">
            <h3 className="font-semibold">Debug Information</h3>
            <div className="p-3 bg-gray-100 rounded text-sm">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>

          {/* Firebase Connection Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Firebase Connection Test</h3>
            <div className="flex gap-2">
              <Button
                onClick={testFirebaseConnectionHandler}
                variant="outline"
              >
                Test Firebase Connection
              </Button>
              <Button
                onClick={testFirebaseReachabilityHandler}
                variant="outline"
              >
                Test Firebase API Reachability
              </Button>
            </div>
            {firebaseTest && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <p><strong>Connection Test:</strong> {firebaseTest.success ? 'Success' : 'Failed'}</p>
                {firebaseTest.error && (
                  <p><strong>Error:</strong> {JSON.stringify(firebaseTest.error)}</p>
                )}
              </div>
            )}
            {reachabilityTest !== null && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <p><strong>API Reachability:</strong> {reachabilityTest ? 'Success' : 'Failed'}</p>
              </div>
            )}
          </div>

          {/* Network Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Network Test</h3>
            <Button
              onClick={checkNetworkConnectivity}
              variant="outline"
            >
              Test Network Connectivity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
