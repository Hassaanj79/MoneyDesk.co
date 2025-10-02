"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function AppleSignInButton({ 
  onSuccess, 
  onError, 
  className = "",
  children 
}: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
      onSuccess?.();
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign in with Apple';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Apple sign-in is not enabled. Please contact support.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleAppleSignIn}
      disabled={loading}
      className={`w-full bg-black text-white hover:bg-gray-800 border-gray-600 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )}
      {children || "Continue with Apple"}
    </Button>
  );
}
