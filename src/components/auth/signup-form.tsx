
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
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const GoogleIcon = () => <svg className="size-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.86 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;
const AppleIcon = () => <svg className="size-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19.39,14.73C19.33,14.7,18.4,14.1,17.43,14.1c-1,0-1.8,0.59-2.31,0.59c-0.5,0-1.25-0.6-2.3-0.6c-1.09,0-2.07,0.61-2.58,0.61c-0.52,0-1.33-0.57-2.26-0.59c-0.97,0-1.9,0.54-2.45,0.56c-0.55,0-1.36-0.66-2.35-1.55c-1.28-1.15-2.2-3.1-2.2-5.38c0-2.73,1.67-4.2,3.39-4.21c0.9,0,1.83,0.6,2.44,0.6c0.59,0,1.4-0.62,2.54-0.62c1.1,0,1.88,0.6,2.43,0.6s1.42-0.58,2.5-0.58c1.04,0,1.88,0.5,2.4,0.5s1.39-0.53,2.2-0.53c1.69,0,3.3,1.44,3.3,4.2C21.6,12.33,20.48,13.84,19.39,14.73z M15.35,1.75c0.23-0.29,0.43-0.61,0.59-0.94c-1.13-0.54-2.43-0.78-3.77-0.78c-1.5,0-2.88,0.37-3.96,1c-0.01,0-0.02,0.01-0.03,0.01c-0.29,0.22-0.56,0.47-0.8,0.73c-0.9,0.96-1.52,2.3-1.53,3.87c0.01,0.02,0.02,0.03,0.03,0.05c1.1,0.02,2.29-0.59,3.19-0.6c0.88-0.01,1.88,0.6,2.69,0.6c0.8,0,1.63-0.6,2.6-0.62C14.76,5.1,15.7,4.07,15.35,1.75z"></path></svg>;

export function SignupForm() {
    const { signup, loginWithGoogle, loginWithApple } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState({ email: false, google: false, apple: false });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(prev => ({...prev, email: true}));
    setError(null);
    try {
        await signup(values.email, values.password, values.name);
    } catch(err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError("This email is already in use. Please try another one.");
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
    } finally {
        setLoading(prev => ({...prev, email: false}));
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(prev => ({...prev, [provider]: true}));
    setError(null);
    try {
      if (provider === 'google') await loginWithGoogle();
      if (provider === 'apple') await loginWithApple();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(prev => ({...prev, [provider]: false}));
    }
  };

  return (
    <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your details to get started with MoneyDesk.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" type="button" onClick={() => handleSocialLogin('google')} disabled={loading.google || loading.apple}>
                        {loading.google ? <Loader2 className="animate-spin" /> : <GoogleIcon />} Google
                    </Button>
                    <Button variant="outline" type="button" onClick={() => handleSocialLogin('apple')} disabled={loading.google || loading.apple}>
                        {loading.apple ? <Loader2 className="animate-spin" /> : <AppleIcon />} Apple
                    </Button>
                </div>
                <div className="relative">
                    <Separator className="absolute top-1/2 -translate-y-1/2" />
                    <p className="text-center text-xs text-muted-foreground bg-card px-2 relative w-fit mx-auto">OR</p>
                </div>
                 <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading.email}>
                  {loading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
            </form>
            </Form>
            <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Login
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}
