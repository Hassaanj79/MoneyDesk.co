"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface SimpleRecaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action?: string;
}

export function SimpleRecaptcha({ onVerify, onError, action = 'submit' }: SimpleRecaptchaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script in the head
    const loadRecaptcha = () => {
      if (typeof window === 'undefined') return;

      // Check if already loaded
      if ((window as any).grecaptcha) {
        setIsAvailable(true);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setIsAvailable(true);
        });
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=6Lcdl-IrAAAAAJgH-_hLhYabq387rGlLgNomhb4r';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('reCAPTCHA loaded successfully');
        setIsAvailable(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA');
        setError('Failed to load reCAPTCHA. Please check your internet connection.');
        onError?.('Failed to load reCAPTCHA');
      };

      document.head.appendChild(script);
    };

    loadRecaptcha();
  }, [onError]);

  const handleExecuteRecaptcha = async () => {
    if (isLoading || !isAvailable) return;

    setIsLoading(true);
    setError('');

    try {
      // Wait for grecaptcha to be available
      let attempts = 0;
      while (!(window as any).grecaptcha && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!(window as any).grecaptcha) {
        throw new Error('reCAPTCHA not available');
      }

      // Execute reCAPTCHA
      const token = await (window as any).grecaptcha.execute('6Lcdl-IrAAAAAJgH-_hLhYabq387rGlLgNomhb4r', { action });
      
      if (!token) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      console.log('reCAPTCHA token received:', token.substring(0, 20) + '...');
      onVerify(token);

    } catch (error: any) {
      console.error('reCAPTCHA error:', error);
      const errorMessage = error.message || 'reCAPTCHA verification failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAvailable) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Loading reCAPTCHA... Please wait.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Security verification</span>
      </div>
      
      <Button
        type="button"
        onClick={handleExecuteRecaptcha}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Complete Security Check
          </>
        )}
      </Button>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{' '}
        apply.
      </p>
    </div>
  );
}
