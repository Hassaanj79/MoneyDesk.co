"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  initializeRecaptcha, 
  enrollSMS2FA, 
  completeSMS2FAEnrollment,
  hasSMS2FAEnrolled,
  unenrollSMS2FA
} from '@/services/sms-2fa';
import { CountrySelector } from './country-selector';

interface SMS2FAEnrollmentProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SMS2FAEnrollment({ onComplete, onCancel }: SMS2FAEnrollmentProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
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
    // Check if user already has SMS 2FA enrolled
    const checkEnrollment = () => {
      const enrolled = hasSMS2FAEnrolled();
      setIsEnrolled(enrolled);
      if (enrolled) {
        setStep('complete');
      }
    };

    checkEnrollment();
  }, []);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (recaptchaRef.current && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
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
  }, []);

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
      const result = await enrollSMS2FA(phoneNumber, recaptchaVerifierRef.current);
      
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
      const result = await completeSMS2FAEnrollment(verificationId, verificationCode);
      
      if (result.success) {
        setStep('complete');
        setIsEnrolled(true);
        toast.success('SMS 2FA enrolled successfully!');
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

  const handleUnenroll = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await unenrollSMS2FA();
      
      if (result.success) {
        setIsEnrolled(false);
        setStep('phone');
        setPhoneNumber('');
        setVerificationCode('');
        toast.success('SMS 2FA unenrolled successfully');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to unenroll SMS 2FA');
      toast.error('Failed to unenroll SMS 2FA');
    } finally {
      setIsLoading(false);
    }
  };


  if (step === 'complete' && isEnrolled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">SMS 2FA Enabled</CardTitle>
          <CardDescription>
            Your account is now protected with SMS two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>📱 SMS verification is active</p>
            <p>🔒 Your account is more secure</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleUnenroll}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable SMS 2FA'}
            </Button>
            <Button 
              onClick={onComplete}
              className="flex-1"
            >
              Done
            </Button>
          </div>
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
                Enter the 6-digit code sent to {phoneNumber}
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
        <div id="recaptcha-container" ref={recaptchaRef} className="hidden"></div>
      </CardContent>
    </Card>
  );
}
