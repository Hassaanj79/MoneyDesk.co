"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Phone } from 'lucide-react';
import { SimpleSMS2FAEnrollment } from '@/components/auth/simple-sms-2fa-enrollment';
import { toast } from 'sonner';

export default function SMS2FAPage() {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  React.useEffect(() => {
    // For now, we'll assume no enrollment and let the user set it up
    setIsEnrolled(false);
    setIsChecking(false);
  }, []);

  const handleComplete = () => {
    toast.success('SMS 2FA setup completed!');
    router.push('/settings?tab=security');
  };

  const handleCancel = () => {
    router.push('/settings?tab=security');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Checking Security Settings</CardTitle>
            <CardDescription>
              Please wait while we check your current security configuration...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">SMS Two-Factor Authentication</h1>
                <p className="text-gray-600">Secure your account with SMS verification</p>
              </div>
            </div>
          </div>

          {/* Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What is SMS 2FA?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                SMS Two-Factor Authentication adds an extra layer of security to your account. 
                When you sign in, you'll receive a verification code via SMS that you'll need to enter.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Enhanced account security</li>
                  <li>• Protection against unauthorized access</li>
                  <li>• Real-time notifications of login attempts</li>
                  <li>• Easy to use and understand</li>
                  <li>• Support for international phone numbers</li>
                </ul>
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
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇦🇺 Australia</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇩🇪 Germany</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇫🇷 France</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇯🇵 Japan</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🇨🇳 China</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">+ More</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Make sure you have access to the phone number you provide. 
                  You'll need it to sign in to your account.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* SMS 2FA Enrollment Component */}
          <SimpleSMS2FAEnrollment 
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
