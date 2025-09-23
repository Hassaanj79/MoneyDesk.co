"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifySignupOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, resendSignupOTP } = useAuth();
  
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only numbers, max 6 digits
    setOtp(value);
    setError(null);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Email not found. Please try signing up again.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await verifyOTP(email, otp);
      setSuccess('Email verified successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;

    setResendLoading(true);
    setResendSuccess(null);
    setError(null);

    try {
      await resendSignupOTP(email);
      setResendSuccess('OTP sent successfully! Please check your email.');
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-2xl font-bold mt-4">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {resendSuccess && (
            <Alert className="mb-4 border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{resendSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter OTP
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={handleOtpChange}
                placeholder="123456"
                className="h-12 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium underline-offset-4 hover:underline transition-colors disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Didn't receive the code? Resend OTP"
                )}
              </button>
            </div>

            <div className="text-center">
              <Link 
                href="/signup" 
                className="text-sm text-gray-600 hover:text-gray-700 font-medium underline-offset-4 hover:underline transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Signup
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
