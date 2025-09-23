"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export function EmailOTPVerification() {
  const { verifyEmail, sendOTPEmail } = useAuth();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (value: string) => {
    // Only allow 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
    setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Email not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyEmail(email, otp);
      setSuccess(true);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      if (error.message.includes('expired')) {
        setError('OTP has expired. Please request a new one.');
      } else if (error.message.includes('attempts')) {
        setError('Maximum attempts exceeded. Please request a new OTP.');
      } else {
        setError('Invalid OTP. Please check and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email not found');
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      await sendOTPEmail(email);
      setTimeLeft(600); // Reset timer to 10 minutes
      toast.success('New OTP sent to your email');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-gray-600">
                Your email has been successfully verified. You can now access all features.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Continue to App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email || 'your email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => handleOTPChange(e.target.value)}
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {timeLeft > 0 ? (
              <div className="text-center text-sm text-gray-600">
                Code expires in {formatTime(timeLeft)}
              </div>
            ) : (
              <div className="text-center text-sm text-red-600">
                Code has expired. Please request a new one.
              </div>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Didn't receive the code? Check your spam folder or{' '}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                resend
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
