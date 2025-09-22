
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
      await sendPasswordReset(forgotEmail);
      setResetSuccess("If an account exists for this email, a password reset link has been sent.");
      setForgotEmail("");
    } catch (err) {
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(prev => ({...prev, email: false}));
    }
  }



  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{isForgotPassword ? "Reset Password" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isForgotPassword
            ? "Enter your email to receive a password reset link."
            : "Sign in to your MoneyDesk account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isForgotPassword ? (
          <form onSubmit={onForgotPasswordSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {resetSuccess && <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400"><AlertDescription>{resetSuccess}</AlertDescription></Alert>}
            
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium">Email</label>
              <Input 
                id="forgot-email"
                type="email" 
                placeholder="john.doe@example.com" 
                value={forgotEmail}
                onChange={handleForgotEmailChange}
                className={forgotEmailError ? "border-red-500" : ""}
              />
              {forgotEmailError && (
                <p className="text-sm text-red-500">{forgotEmailError}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading.email}>
              {loading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
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
        <div className="mt-4 text-center text-sm">
          {isForgotPassword ? (
            <button onClick={() => setIsForgotPassword(false)} className="underline">
              Back to Login
            </button>
          ) : (
            <>
              Don't have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
