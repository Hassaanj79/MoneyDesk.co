"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Mail } from "lucide-react";

const otpSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const verifyOtpSchema = z.object({
  otp: z.string().min(6, "OTP must be at least 6 characters."),
});

interface OTPVerificationProps {
  mode: 'send' | 'verify';
  email?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function OTPVerification({ mode, email: initialEmail, onSuccess, onBack }: OTPVerificationProps) {
  const { sendOTPEmail, verifyOTP } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'send' | 'verify'>(mode);
  const [currentEmail, setCurrentEmail] = useState(initialEmail || '');

  const sendForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: initialEmail || "",
    },
  });

  const verifyForm = useForm<z.infer<typeof verifyOtpSchema>>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSendOTP(values: z.infer<typeof otpSchema>) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await sendOTPEmail(values.email);
      setCurrentEmail(values.email);
      setCurrentMode('verify');
      setSuccess("OTP sent to your email! Please check your inbox.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOTP(values: z.infer<typeof verifyOtpSchema>) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await verifyOTP(currentEmail, values.otp);
      setSuccess("OTP verified successfully!");
      verifyForm.reset();
      onSuccess?.();
    } catch (err: any) {
      if (err.code === 'auth/invalid-action-code') {
        setError("Invalid OTP. Please check and try again.");
      } else if (err.code === 'auth/expired-action-code') {
        setError("OTP has expired. Please request a new one.");
      } else {
        setError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await sendOTPEmail(currentEmail);
      setSuccess("New OTP sent to your email!");
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentMode === 'send') {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send OTP
          </CardTitle>
          <CardDescription>
            Enter your email address to receive a one-time password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(onSendOTP)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={sendForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          </Form>
          
          {onBack && (
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={onBack} className="text-sm">
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {currentEmail}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...verifyForm}>
          <form onSubmit={verifyForm.handleSubmit(onVerifyOTP)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={verifyForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456" 
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>
          </form>
        </Form>
        
        <div className="mt-4 space-y-2">
          <Button 
            variant="outline" 
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend OTP
          </Button>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentMode('send')}
              className="text-sm"
            >
              Change Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
