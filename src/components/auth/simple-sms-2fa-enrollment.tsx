"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  initializeSimpleRecaptcha, 
  sendSMSVerificationCode, 
  verifySMSCode,
  isPhoneAuthAvailable,
  formatPhoneForDisplay
} from '@/services/simple-sms-2fa';
import { CountrySelector } from './country-selector';

interface SimpleSMS2FAEnrollmentProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SimpleSMS2FAEnrollment({ onComplete, onCancel }: SimpleSMS2FAEnrollmentProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dialCode: '+92',
    format: '+92 XXX XXXXXXX',
    example: '+92 300 1234567'
  });
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    // Check if phone authentication is available
    const checkAvailability = () => {
      const available = isPhoneAuthAvailable();
      setIsAvailable(available);
      if (!available) {
        setError('Phone authentication is not available in this environment.');
      }
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (recaptchaRef.current && !recaptchaVerifierRef.current && isAvailable) {
      try {
        recaptchaVerifierRef.current = initializeSimpleRecaptcha('simple-recaptcha-container');
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Failed to initialize reCAPTCHA. Please refresh the page.');
      }
    }

    return () => {
      // Clean up reCAPTCHA when component unmounts
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
      }
    };
  }, [isAvailable]);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await sendSMSVerificationCode(phoneNumber, recaptchaVerifierRef.current);
      
      if (result.success) {
        setVerificationId(result.verificationId || '');
        setStep('verify');
        toast.success('SMS verification code sent!');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send SMS code');
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

    setIsLoading(true);
    setError('');

    try {
      const result = await verifySMSCode(verificationId, verificationCode);
      
      if (result.success) {
        setStep('complete');
        toast.success('SMS 2FA setup completed successfully!');
        onComplete?.();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify SMS code');
      toast.error('Failed to verify SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAvailable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Phone Authentication Unavailable</CardTitle>
          <CardDescription>
            SMS 2FA is not available in this environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Phone authentication is not properly configured. Please contact support or try again later.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">SMS 2FA Setup Complete</CardTitle>
          <CardDescription>
            Your account is now protected with SMS verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>📱 SMS verification is active</p>
            <p>🔒 Your account is more secure</p>
            <p>📞 Phone: {formatPhoneForDisplay(phoneNumber)}</p>
          </div>
          
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
        <CardTitle className="text-2xl">Enable SMS 2FA</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' && (
          <>
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
            />
            <p className="text-xs text-muted-foreground">
              Enter your phone number to receive verification codes
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
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
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
                Enter the 6-digit code sent to {formatPhoneForDisplay(phoneNumber)}
              </p>
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

        {/* Hidden reCAPTCHA container */}
        <div id="simple-recaptcha-container" ref={recaptchaRef} className="hidden"></div>
      </CardContent>
    </Card>
  );
}
