"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailLink, isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      setError('No email provided. Please try the login link again.');
      setIsVerifying(false);
      return;
    }

    // Check if this is a valid email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      handleEmailSignIn();
    } else {
      setError('Invalid verification link. Please request a new login link.');
      setIsVerifying(false);
    }
  }, [email]);

  const handleEmailSignIn = async () => {
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailLink(auth, email, window.location.href);
      setSuccess(true);
      toast({
        title: "Email Verified Successfully",
        description: "You have been signed in successfully!",
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setError(error.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-600">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">Email Verified Successfully!</h2>
              <p className="text-gray-600">
                You have been signed in successfully. You will be redirected to the dashboard shortly.
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Email Verification</CardTitle>
          <CardDescription>
            {email ? `Verifying email: ${email}` : 'Please wait while we verify your email...'}
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

          <div className="space-y-4">
            <Button 
              onClick={handleEmailSignIn}
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Having trouble?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Try logging in again
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}