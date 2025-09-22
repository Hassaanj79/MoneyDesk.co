"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reset' | null>(null);
  const [email, setEmail] = useState<string>('');
  
  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleAuthAction = async () => {
      try {
        const oobCode = searchParams.get('oobCode');
        const mode = searchParams.get('mode');
        const emailParam = searchParams.get('email');

        if (!oobCode) {
          setError('Invalid or missing authentication code.');
          setLoading(false);
          return;
        }

        if (emailParam) {
          setEmail(emailParam);
        }

        if (mode === 'verifyEmail') {
          // Email verification
          setActionType('verify');
          await applyActionCode(auth, oobCode);
          setSuccess('Email verified successfully! You can now sign in to your account.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else if (mode === 'resetPassword') {
          // Password reset - verify the code first
          setActionType('reset');
          try {
            const email = await verifyPasswordResetCode(auth, oobCode);
            setEmail(email);
            setSuccess('Code verified. Please enter your new password.');
          } catch (err: any) {
            setError('Invalid or expired reset code. Please request a new password reset.');
          }
        } else {
          // Try to determine the action type automatically
          try {
            // Try email verification first
            await applyActionCode(auth, oobCode);
            setActionType('verify');
            setSuccess('Email verified successfully! You can now sign in to your account.');
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          } catch (verifyError) {
            try {
              // Try password reset verification
              const email = await verifyPasswordResetCode(auth, oobCode);
              setActionType('reset');
              setEmail(email);
              setSuccess('Code verified. Please enter your new password.');
            } catch (resetError) {
              setError('Invalid or expired authentication code. Please try again.');
            }
          }
        }
      } catch (err: any) {
        console.error('Auth action error:', err);
        setError(err.message || 'An error occurred while processing your request.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthAction();
  }, [searchParams, router]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setIsResetting(true);
    setPasswordError('');
    setError(null);

    try {
      const oobCode = searchParams.get('oobCode');
      if (!oobCode) {
        throw new Error('Invalid reset code');
      }

      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Password reset successfully! You can now sign in with your new password.');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500';
    if (strength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-sm text-gray-600">Processing your request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {actionType === 'verify' ? (
              <Mail className="h-12 w-12 text-green-600" />
            ) : (
              <Lock className="h-12 w-12 text-purple-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {actionType === 'verify' ? 'Email Verification' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {actionType === 'verify' 
              ? 'Your email has been verified successfully'
              : 'Enter your new password below'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {actionType === 'reset' && !success.includes('successfully') && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {email && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={passwordError ? "border-red-500" : ""}
                  placeholder="Enter your new password"
                />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-full rounded ${
                            level <= getPasswordStrength(newPassword)
                              ? getStrengthColor(getPasswordStrength(newPassword))
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Password strength: {getPasswordStrength(newPassword)}/5
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={passwordError ? "border-red-500" : ""}
                  placeholder="Confirm your new password"
                />
              </div>
              
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isResetting || !newPassword || !confirmPassword}
              >
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
