
"use client";

import { useState } from "react";
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
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
// TOTP imports removed - only enable when user explicitly turns it on

const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});



export function LoginForm() {
  const { login, sendPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ email: false });
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // TOTP state removed - only enable when user explicitly turns it on

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(prev => ({...prev, email: true}));
    setError(null);
    try {
      await login(values.email, values.password);
      // TOTP check removed - only enable when user explicitly turns it on
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(prev => ({...prev, email: false}));
    }
  }

  const validateForgotEmail = (email: string) => {
    if (!email) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleForgotEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Email changed to:', value);
    setForgotEmail(value);
    setForgotEmailError("");
    setError(null);
  };

  // TOTP handlers removed - only enable when user explicitly turns it on

  async function onForgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    console.log('Form submitted with email:', forgotEmail);
    const emailValidationError = validateForgotEmail(forgotEmail);
    console.log('Validation error:', emailValidationError);
    
    if (emailValidationError) {
      setForgotEmailError(emailValidationError);
      return;
    }

    setLoading(prev => ({...prev, email: true}));
    setError(null);
    setResetSuccess(null);
    setForgotEmailError("");
    
    try {
      console.log('Sending password reset for email:', forgotEmail);
      await sendPasswordReset(forgotEmail);
      console.log('Password reset email sent successfully');
      setResetSuccess("If an account exists for this email, a password reset link has been sent.");
      setForgotEmail("");
    } catch (err) {
      console.error('Password reset error:', err);
      setError(`Failed to send password reset email: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({...prev, email: false}));
    }
  }



  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className={isForgotPassword ? "pb-4" : ""}>
        <CardTitle className={isForgotPassword ? "text-2xl font-bold text-center" : ""}>
          {isForgotPassword ? "Reset Your Password" : "Welcome back"}
        </CardTitle>
        <CardDescription className={isForgotPassword ? "text-center text-gray-600 dark:text-gray-400" : ""}>
          {isForgotPassword
            ? "We'll send you a secure link to reset your password"
            : "Sign in to your MoneyDesk account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isForgotPassword ? (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {resetSuccess && (
              <Alert variant="default" className="mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                <AlertDescription>{resetSuccess}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={onForgotPasswordSubmit} className="space-y-5">
              <div className="space-y-3">
                <label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <Input 
                  id="forgot-email"
                  type="email" 
                  placeholder="Enter your email address" 
                  value={forgotEmail}
                  onChange={handleForgotEmailChange}
                  className={`h-12 text-base ${forgotEmailError ? "border-red-500 focus:border-red-500" : "focus:border-purple-500"}`}
                />
                {forgotEmailError && (
                  <p className="text-sm text-red-500 font-medium">{forgotEmailError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" 
                disabled={loading.email}
              >
                {loading.email ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Password Reset Link"
                )}
              </Button>
            </form>
            
            <div className="text-center">
              <button 
                onClick={() => setIsForgotPassword(false)} 
                className="text-sm text-purple-600 hover:text-purple-700 font-medium underline-offset-4 hover:underline transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        ) : (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="ml-auto inline-block text-sm underline">
                            Forgot your password?
                        </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading.email}>
                {loading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        )}
        {!isForgotPassword && (
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // TOTP verification removed - only enable when user explicitly turns it on

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className={isForgotPassword ? "pb-4" : ""}>
        <CardTitle className={isForgotPassword ? "text-2xl font-bold text-center" : ""}>
          {isForgotPassword ? "Reset Your Password" : "Welcome back"}
        </CardTitle>
        <CardDescription className={isForgotPassword ? "text-center text-gray-600 dark:text-gray-400" : ""}>
          {isForgotPassword
            ? "We'll send you a secure link to reset your password"
            : "Sign in to your MoneyDesk account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isForgotPassword ? (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {resetSuccess && (
              <Alert variant="default" className="mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                <AlertDescription>{resetSuccess}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={onForgotPasswordSubmit} className="space-y-5">
              <div className="space-y-3">
                <label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <Input 
                  id="forgot-email"
                  type="email" 
                  placeholder="Enter your email address" 
                  value={forgotEmail}
                  onChange={handleForgotEmailChange}
                  className={`h-12 text-base ${forgotEmailError ? "border-red-500 focus:border-red-500" : "focus:border-purple-500"}`}
                />
                {forgotEmailError && (
                  <p className="text-sm text-red-500 font-medium">{forgotEmailError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" 
                disabled={loading.email}
              >
                {loading.email ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={loginForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <Button type="submit" className="w-full" disabled={loading.email}>
                {loading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        )}
        {!isForgotPassword && (
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
