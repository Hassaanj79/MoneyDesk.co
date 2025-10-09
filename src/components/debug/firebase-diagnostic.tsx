"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function FirebaseDiagnostic() {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Not tested');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Check Firebase configuration
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApRM4MIHiZCRgoLxGkRI-6nnlmvAO_9CA",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chirpchat-yi7xn.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chirpchat-yi7xn",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chirpchat-yi7xn.appspot.com",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "786711867654",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:786711867654:web:a845ace12b0f9c526c2e87"
    };
    
    setProjectInfo(config);

    // Check authentication
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setAuthStatus('✅ Authenticated');
        
        // Test Firestore access
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setFirestoreStatus('✅ Can read user document');
          } else {
            setFirestoreStatus('⚠️ User document does not exist');
          }
        } catch (error: any) {
          setFirestoreStatus(`❌ Firestore error: ${error.message}`);
          setErrors(prev => [...prev, `Firestore error: ${error.message}`]);
        }
      } else {
        setUser(null);
        setAuthStatus('❌ Not authenticated');
        setFirestoreStatus('Not tested (no user)');
      }
    }, (error) => {
      setAuthStatus(`❌ Auth error: ${error.message}`);
      setErrors(prev => [...prev, `Auth error: ${error.message}`]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Project Configuration:</h3>
            <div className="space-y-1 text-sm">
              <div>Project ID: <Badge variant="outline">{projectInfo?.projectId}</Badge></div>
              <div>Auth Domain: <Badge variant="outline">{projectInfo?.authDomain}</Badge></div>
              <div>API Key: <Badge variant="outline">{projectInfo?.apiKey?.substring(0, 20)}...</Badge></div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Authentication Status:</h3>
            <Badge variant={authStatus.includes('✅') ? 'default' : 'destructive'}>
              {authStatus}
            </Badge>
            {user && (
              <div className="mt-2 text-sm">
                <div>Email: {user.email}</div>
                <div>UID: {user.uid}</div>
                <div>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</div>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Firestore Status:</h3>
            <Badge variant={firestoreStatus.includes('✅') ? 'default' : firestoreStatus.includes('⚠️') ? 'secondary' : 'destructive'}>
              {firestoreStatus}
            </Badge>
          </div>

          {errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Errors:</h3>
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
