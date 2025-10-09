"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Phone, Settings, AlertTriangle } from 'lucide-react';
import { FirebaseSMS2FA } from '@/components/auth/firebase-sms-2fa';
import { toast } from 'sonner';

export default function FirebaseSMS2FAPage() {
  const router = useRouter();

  const handleComplete = () => {
    toast.success('Firebase SMS 2FA completed!');
    router.push('/settings?tab=security');
  };

  const handleCancel = () => {
    router.push('/settings?tab=security');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/settings?tab=security')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Security Settings
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Firebase SMS Two-Factor Authentication</h1>
                <p className="text-gray-600">Real SMS 2FA using Firebase Phone Authentication</p>
              </div>
            </div>
          </div>

          {/* Firebase Setup Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Firebase Configuration Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Before using this feature:</strong> You need to configure Firebase Phone Authentication in your Firebase Console.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Required Firebase Setup:</h4>
                <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                  <li>Go to Firebase Console → Authentication → Sign-in method</li>
                  <li>Enable "Phone" provider</li>
                  <li>Configure reCAPTCHA settings</li>
                  <li>Set up billing for SMS (Firebase charges for SMS)</li>
                  <li>Add authorized domains (localhost, moneydesk.co)</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Supported Countries:</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇵🇰 Pakistan</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇺🇸 United States</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇬🇧 United Kingdom</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇮🇳 India</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇦🇪 UAE</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇸🇦 Saudi Arabia</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">+ More</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Cost:</strong> Firebase charges for SMS messages (approximately $0.01-0.05 per SMS depending on country).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Firebase SMS 2FA Component */}
          <FirebaseSMS2FA 
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
