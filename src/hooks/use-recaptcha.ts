"use client";

import { useState, useCallback } from 'react';
import { executeRecaptcha } from '@/services/recaptcha';

export interface UseRecaptchaReturn {
  recaptchaToken: string | null;
  isVerifying: boolean;
  recaptchaError: string | null;
  executeRecaptcha: (action?: string) => Promise<boolean>;
  resetRecaptcha: () => void;
}

/**
 * Hook for managing reCAPTCHA verification in forms
 */
export const useRecaptcha = (): UseRecaptchaReturn => {
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const executeRecaptchaVerification = useCallback(async (action: string = 'submit'): Promise<boolean> => {
    setIsVerifying(true);
    setRecaptchaError(null);

    try {
      const result = await executeRecaptcha(action);
      
      if (result.success && result.token) {
        setRecaptchaToken(result.token);
        return true;
      } else {
        setRecaptchaError(result.error || 'reCAPTCHA verification failed');
        return false;
      }
    } catch (error: any) {
      setRecaptchaError(error.message || 'reCAPTCHA verification failed');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const resetRecaptcha = useCallback(() => {
    setRecaptchaToken(null);
    setRecaptchaError(null);
    setIsVerifying(false);
  }, []);

  return {
    recaptchaToken,
    isVerifying,
    recaptchaError,
    executeRecaptcha: executeRecaptchaVerification,
    resetRecaptcha
  };
};
