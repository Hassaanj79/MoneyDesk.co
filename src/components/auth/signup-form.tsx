
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
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Eye, EyeOff, Phone, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "./google-signin-button";
import { SimpleRecaptcha } from "./simple-recaptcha";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required.").min(2, "Name must be at least 2 characters."),
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
  phone: z.string()
    .min(1, "Phone number is required.")
    .min(10, "Phone number must be at least 10 digits.")
    .regex(/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number with country code (e.g., +1234567890)."),
  password: z.string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export function SignupForm() {
    const { signup, sendEmailVerification } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState({ email: false });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score, strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong' };
  };

  const passwordStrength = getPasswordStrength(form.watch('password') || '');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check if reCAPTCHA token exists
    if (!recaptchaToken) {
      setError('Please complete the security verification first');
      return;
    }

    setLoading(prev => ({...prev, email: true}));
    setError(null);
    try {
        // Create user account
        await signup(values.email, values.password, values.name, values.phone);
        
        // Send verification email
        await sendEmailVerification(values.email);
        
        // Redirect to a static "verify email" screen
        router.push(`/verify-email-sent?email=${encodeURIComponent(values.email)}`);
    } catch(err: any) {
        console.error('Signup error:', err);
        if (err.code === 'auth/email-already-in-use') {
            setError("This email is already in use. Please try another one.");
        } else if (err.code === 'auth/weak-password') {
            setError("Password is too weak. Please choose a stronger password.");
        } else if (err.code === 'auth/invalid-email') {
            setError("Please enter a valid email address.");
        } else if (err.message && err.message.includes('phone')) {
            setError("Please enter a valid phone number with country code.");
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
        // Reset reCAPTCHA on error
        setRecaptchaToken(null);
    } finally {
        setLoading(prev => ({...prev, email: false}));
    }
  }


  return (
    <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your details to get started with MoneyDesk.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
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
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone number *
                        </FormLabel>
                        <FormControl>
                            <PhoneInput
                                value={field.value}
                                onChange={field.onChange}
                                onCountryChange={setSelectedCountry}
                                placeholder="Enter phone number"
                                className=""
                                required
                            />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Country will be auto-detected from number</span>
                            {selectedCountry && (
                                <span className="text-green-600 dark:text-green-400">
                                    {selectedCountry.flag} {selectedCountry.name}
                                </span>
                            )}
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
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
                        {/* Password Strength Indicator */}
                        {field.value && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">Password strength:</span>
                                    <span className={`font-medium ${
                                        passwordStrength.strength === 'weak' ? 'text-red-500' :
                                        passwordStrength.strength === 'medium' ? 'text-yellow-500' :
                                        'text-green-500'
                                    }`}>
                                        {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {[
                                        { key: 'length', label: 'At least 8 characters' },
                                        { key: 'uppercase', label: 'One uppercase letter' },
                                        { key: 'lowercase', label: 'One lowercase letter' },
                                        { key: 'number', label: 'One number' },
                                        { key: 'special', label: 'One special character (@$!%*?&)' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <XCircle className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? 'text-green-600' : 'text-red-600'}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="Confirm your password" 
                                    {...field} 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                {/* reCAPTCHA Status */}
                {recaptchaToken && (
                  <Alert>
                    <AlertDescription>
                      ✅ Security verification completed
                    </AlertDescription>
                  </Alert>
                )}

                {/* reCAPTCHA Component */}
                {!recaptchaToken && (
                  <div className="pt-2">
                    <SimpleRecaptcha
                      onVerify={(token: string) => {
                        setRecaptchaToken(token);
                        setError(null);
                      }}
                      onError={(error) => {
                        setError(`Security verification failed: ${error}`);
                      }}
                      action="signup"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading.email || !recaptchaToken}>
                  {loading.email && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!recaptchaToken ? 'Complete Security Check First' : 'Create Account'}
                </Button>
            </form>
            </Form>
            
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                
                <div className="mt-6 space-y-3">
                    <GoogleSignInButton
                        onSuccess={() => {
                            // Let the 2FA guard handle navigation and verification
                            // Don't navigate immediately - the auth state change will trigger the guard
                            toast.success("Successfully signed up with Google!");
                        }}
                        onError={(error) => {
                            setError(error.message || "Failed to sign in with Google");
                        }}
                    />
                </div>
            </div>
            
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
