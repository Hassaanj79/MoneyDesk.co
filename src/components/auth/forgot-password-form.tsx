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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordReset(values.email);
      setSuccess("If an account with this email exists, a password reset link has been sent.");
      form.reset();
    } catch (err) {
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
                Enter your email to receive a password reset link.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
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
                <FormField
                control={form.control}
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
                  Send Reset Link
                </Button>
            </form>
            </Form>
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
