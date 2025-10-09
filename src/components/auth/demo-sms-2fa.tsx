"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { 
  demoSMSService, 
  formatPhoneForDisplay, 
  validatePhoneNumber 
} from '@/services/demo-sms-2fa';
import { CountrySelector } from './country-selector';

interface DemoSMS2FAProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function DemoSMS2FA({ onComplete, onCancel }: DemoSMS2FAProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [error, setError] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dialCode: '+92',
    format: '+92 XXX XXXXXXX',
    example: '+92 300 1234567'
  });

  const handleSendCode = async () => {
    // Validate phone number
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setError(validation.message || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await demoSMSService.sendCode(phoneNumber);
      
      if (result.success) {
        setSentCode(result.code || '');
        setStep('verify');
        toast.success('Demo SMS sent! Check console for the code.');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setError('Failed to send SMS code');
      toast.error('Failed to send SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await demoSMSService.verifyCode(verificationCode);
      
      if (result.success) {
        setStep('complete');
        toast.success('SMS 2FA setup completed successfully!');
        onComplete?.();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setError('Failed to verify SMS code');
      toast.error('Failed to verify SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Demo SMS 2FA Complete</CardTitle>
          <CardDescription>
            Your demo SMS 2FA setup is complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>📱 Demo SMS verification is active</p>
            <p>🔒 This is a demonstration only</p>
            <p>📞 Phone: {formatPhoneForDisplay(phoneNumber)}</p>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is a demo implementation. In production, you would receive actual SMS messages.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={onComplete}
            className="w-full"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Demo SMS 2FA</CardTitle>
        <CardDescription>
          Test SMS 2FA functionality (Demo Mode)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a demo version. SMS codes will be displayed in the browser console instead of being sent to your phone.
          </AlertDescription>
        </Alert>

        {step === 'phone' && (
          <>
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
            />
            <p className="text-xs text-muted-foreground">
              Enter your phone number to test SMS 2FA (demo mode)
            </p>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendCode}
                disabled={isLoading || !phoneNumber.trim()}
                className="flex-1"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Demo Code'}
              </Button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code (check browser console for demo code)
              </p>
              {sentCode && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Demo code: <strong>{sentCode}</strong> (also check browser console)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('phone');
                  setVerificationCode('');
                  setError('');
                  setSentCode('');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
