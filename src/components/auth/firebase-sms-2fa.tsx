"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { 
  initializeFirebaseRecaptcha, 
  sendFirebaseSMS, 
  verifyFirebaseSMS,
  isFirebaseSMSAvailable,
  getFirebaseConfigStatus,
  formatPhoneForFirebase,
  validatePhoneForFirebase
} from '@/services/firebase-sms-2fa';
import { CountrySelector } from './country-selector';

interface FirebaseSMS2FAProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function FirebaseSMS2FA({ onComplete, onCancel }: FirebaseSMS2FAProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
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
    // Check Firebase availability and configuration
    const checkFirebase = () => {
      const available = isFirebaseSMSAvailable();
      const status = getFirebaseConfigStatus();
      
      setIsAvailable(available);
      setConfigStatus(status);
      
      if (!available) {
        setError('Firebase SMS is not available. Please check your Firebase configuration.');
      }
    };

    checkFirebase();
  }, []);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts and Firebase is available
    if (recaptchaRef.current && !recaptchaVerifierRef.current && isAvailable) {
      try {
        recaptchaVerifierRef.current = initializeFirebaseRecaptcha('firebase-recaptcha-container');
        console.log('Firebase reCAPTCHA initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase reCAPTCHA:', error);
        setError('Failed to initialize reCAPTCHA. Please check Firebase configuration.');
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
    // Validate phone number
    const validation = validatePhoneForFirebase(phoneNumber);
    if (!validation.valid) {
      setError(validation.message || 'Invalid phone number');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneForFirebase(phoneNumber);
      const result = await sendFirebaseSMS(formattedPhone, recaptchaVerifierRef.current);
      
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
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

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (!confirmationResult) {
      setError('No verification session found. Please request a new code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyFirebaseSMS(confirmationResult, verificationCode);
      
      if (result.success) {
        setStep('complete');
        toast.success('Firebase SMS 2FA setup completed successfully!');
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
          <CardTitle className="text-2xl">Firebase SMS Unavailable</CardTitle>
          <CardDescription>
            Firebase SMS 2FA is not properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Issue:</strong> {configStatus?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
          
          {configStatus && (
            <div className="text-sm space-y-1">
              <p><strong>Project ID:</strong> {configStatus.projectId || 'Not found'}</p>
              <p><strong>API Key:</strong> {configStatus.apiKey || 'Not found'}</p>
              <p><strong>Auth Domain:</strong> {configStatus.authDomain || 'Not found'}</p>
            </div>
          )}
          
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
          <CardTitle className="text-2xl">Firebase SMS 2FA Complete</CardTitle>
          <CardDescription>
            Your Firebase SMS 2FA setup is complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>📱 Firebase SMS verification is active</p>
            <p>🔒 Your account is protected with Firebase</p>
            <p>📞 Phone: {formatPhoneForFirebase(phoneNumber)}</p>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Firebase SMS 2FA is now enabled. You'll receive real SMS messages for verification.
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
        <CardTitle className="text-2xl">Firebase SMS 2FA</CardTitle>
        <CardDescription>
          Secure your account with Firebase SMS verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            This uses Firebase Phone Authentication. Make sure Phone Auth is enabled in your Firebase Console.
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
              Enter your phone number to receive Firebase SMS verification
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
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Firebase SMS'}
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
                Enter the 6-digit code sent to {formatPhoneForFirebase(phoneNumber)}
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
                  setConfirmationResult(null);
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
        <div id="firebase-recaptcha-container" ref={recaptchaRef} className="hidden"></div>
      </CardContent>
    </Card>
  );
}
