"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export function EmailVerification() {
  const { verifyEmail, sendVerificationEmail, user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmailAddress = async () => {
      const actionCode = searchParams.get('oobCode');
      
      if (!actionCode) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        await verifyEmail(actionCode);
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now access all features.');
      } catch (error: any) {
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage('This verification link is invalid or has expired. Please request a new one.');
        } else if (error.code === 'auth/expired-action-code') {
          setMessage('This verification link has expired. Please request a new one.');
        } else {
          setMessage('Failed to verify email. Please try again or contact support.');
        }
      }
    };

    verifyEmailAddress();
  }, [searchParams, verifyEmail]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
          {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
          {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
          Email Verification
        </CardTitle>
        <CardDescription>
          {status === 'loading' && 'Verifying your email address...'}
          {status === 'success' && 'Email verified successfully!'}
          {status === 'error' && 'Email verification failed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={status === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        {status === 'success' && (
          <div className="text-center">
            <Link href="/login">
              <Button className="w-full">
                Continue to Login
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && user && !user.emailVerified && (
          <div className="space-y-2">
            <Button 
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full"
              variant="outline"
            >
              {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (!user || user.emailVerified) && (
          <div className="text-center">
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
