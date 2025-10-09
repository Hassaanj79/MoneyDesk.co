"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { 
  executeRecaptcha, 
  createRecaptchaWidget, 
  resetRecaptchaWidget,
  isRecaptchaAvailable 
} from '@/services/recaptcha';

interface RecaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action?: string;
  visible?: boolean;
  className?: string;
}

export function RecaptchaComponent({ 
  onVerify, 
  onError, 
  action = 'submit',
  visible = false,
  className = ''
}: RecaptchaComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if reCAPTCHA is available
    const checkAvailability = () => {
      const available = isRecaptchaAvailable();
      setIsAvailable(available);
      
      if (!available) {
        console.log('reCAPTCHA not available, attempting to load...');
        // Try to load reCAPTCHA script
        import('@/services/recaptcha').then(({ loadRecaptchaScript }) => {
          loadRecaptchaScript().then(() => {
            console.log('reCAPTCHA script loaded successfully');
            setIsAvailable(true);
          }).catch((error) => {
            console.error('Failed to load reCAPTCHA script:', error);
            setError('Failed to load reCAPTCHA. Please check your internet connection.');
          });
        });
      }
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    if (visible && recaptchaRef.current && isAvailable) {
      // Create visible reCAPTCHA widget
      createRecaptchaWidget(
        recaptchaRef.current.id,
        (token: string) => {
          onVerify(token);
        },
        {
          theme: 'light',
          size: 'normal'
        }
      ).then((id) => {
        setWidgetId(id);
      }).catch((error) => {
        setError('Failed to load reCAPTCHA widget');
        onError?.(error.message);
      });
    }
  }, [visible, isAvailable, onVerify, onError]);

  const handleExecuteRecaptcha = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await executeRecaptcha(action);
      
      if (result.success && result.token) {
        onVerify(result.token);
      } else {
        const errorMessage = result.error || 'reCAPTCHA verification failed';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'reCAPTCHA verification failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (widgetId !== null) {
      resetRecaptchaWidget(widgetId);
    }
    setError('');
  };

  if (!isAvailable) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          reCAPTCHA is not available. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (visible) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Security verification</span>
        </div>
        
        <div 
          id={`recaptcha-widget-${Date.now()}`}
          ref={recaptchaRef}
          className="flex justify-center"
        />
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Security verification</span>
      </div>
      
      <button
        type="button"
        onClick={handleExecuteRecaptcha}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Complete Security Check
          </>
        )}
      </button>
      
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
