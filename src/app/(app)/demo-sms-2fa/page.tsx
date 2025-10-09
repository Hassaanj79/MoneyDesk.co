"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Phone, Info } from 'lucide-react';
import { DemoSMS2FA } from '@/components/auth/demo-sms-2fa';
import { toast } from 'sonner';

export default function DemoSMS2FAPage() {
  const router = useRouter();

  const handleComplete = () => {
    toast.success('Demo SMS 2FA completed!');
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
                <h1 className="text-2xl font-bold text-gray-900">Demo SMS Two-Factor Authentication</h1>
                <p className="text-gray-600">Test SMS 2FA functionality without Firebase integration</p>
              </div>
            </div>
          </div>

          {/* Demo Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Demo Mode Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>This is a demo implementation</strong> that simulates SMS 2FA functionality 
                  without using Firebase or sending actual SMS messages.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Enter your phone number (any format works)</li>
                  <li>• A demo verification code will be generated</li>
                  <li>• The code will be displayed in the browser console</li>
                  <li>• Enter the code to complete the demo</li>
                  <li>• No actual SMS messages are sent</li>
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
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">+ More</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> This demo doesn't interfere with your existing app code or Firebase configuration. 
                  It's completely separate and safe to test.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Demo SMS 2FA Component */}
          <DemoSMS2FA 
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
