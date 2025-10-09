"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  initializeRecaptcha, 
  signInWithSMS2FA,
  MultiFactorResolver
} from '@/services/sms-2fa';

interface SMS2FAVerificationProps {
  resolver: MultiFactorResolver;
  onSuccess: (userCredential: any) => void;
  onCancel: () => void;
}

export function SMS2FAVerification({ resolver, onSuccess, onCancel }: SMS2FAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (recaptchaRef.current && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container-verify');
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Failed to initialize reCAPTCHA. Please refresh the page.');
      }
    }

    // Auto-send verification code when component mounts
    sendVerificationCode();

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

  const sendVerificationCode = async () => {
    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      // Get the phone number from the resolver hints
      const phoneHint = resolver.hints.find(hint => hint.factorId === 'phone');
      if (!phoneHint) {
        throw new Error('Phone number not found');
      }

      const { PhoneAuthProvider } = await import('firebase/auth');
      const phoneAuthProvider = new PhoneAuthProvider();
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        {
          multiFactorHint: phoneHint,
          session: resolver.session
        },
        recaptchaVerifierRef.current
      );

      setVerificationId(verificationId);
      toast.success('SMS verification code sent!');
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setError(error.message || 'Failed to send SMS code');
      toast.error('Failed to send SMS code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!verificationId) {
      setError('Verification ID not found. Please try sending the code again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithSMS2FA(resolver, verificationId, verificationCode);
      
      if (result.success) {
        toast.success('Sign-in successful!');
        onSuccess(result.userCredential);
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

  const handleResendCode = async () => {
    await sendVerificationCode();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the verification code sent to your phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            Enter the 6-digit code sent to your phone
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
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyCode}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleResendCode}
            disabled={isSendingCode}
            className="text-sm"
          >
            {isSendingCode ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Resend Code
              </>
            )}
          </Button>
        </div>

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container-verify" ref={recaptchaRef} className="hidden"></div>
      </CardContent>
    </Card>
  );
}
