"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export function ForgotPasswordForm() {
  const { sendPasswordReset, sendPasswordResetWithOTP } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setEmailError('');
    
    try {
      if (resetMethod === 'otp') {
        await sendPasswordResetWithOTP(email);
        setSuccess("If an account with this email exists, a password reset link has been sent to your email.");
      } else {
        await sendPasswordReset(email);
        setSuccess("If an account with this email exists, a password reset link has been sent.");
      }
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
                Enter your email to receive a password reset link.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email"
                        type="email" 
                        placeholder="john.doe@example.com" 
                        value={email}
                        onChange={handleEmailChange}
                        className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && (
                        <p className="text-sm text-red-500">{emailError}</p>
                    )}
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Reset Method</label>
                  <RadioGroup 
                    value={resetMethod} 
                    onValueChange={(value) => setResetMethod(value as 'email' | 'otp')}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email-method" />
                      <label htmlFor="email-method" className="text-sm">
                        Email Link (Traditional)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="otp" id="otp-method" />
                      <label htmlFor="otp-method" className="text-sm">
                        Email Link with OTP
                      </label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Remember your password?{" "}
                <Link href="/login" className="underline">
                    Back to Login
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}
