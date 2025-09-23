"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Key
} from 'lucide-react';
import { verifyTOTPCode, type TOTPVerificationResult } from '@/services/totp';
import { toast } from 'sonner';

interface TOTPVerificationProps {
  userId: string;
  onSuccess: () => void;
  onBackupCodeUsed?: (remainingCodes: number) => void;
  onError?: (error: string) => void;
}

export function TOTPVerification({ 
  userId, 
  onSuccess, 
  onBackupCodeUsed, 
  onError 
}: TOTPVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: TOTPVerificationResult = await verifyTOTPCode(userId, code.trim());
      
      if (result.valid) {
        if (result.backupCodeUsed && result.remainingBackupCodes !== undefined) {
          toast.warning(`Backup code used. ${result.remainingBackupCodes} codes remaining.`);
          onBackupCodeUsed?.(result.remainingBackupCodes);
        } else {
          toast.success('Verification successful!');
        }
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      const errorMessage = 'Failed to verify code. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Remove non-numeric characters and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError(null);
  };

  const toggleBackupCode = () => {
    setIsBackupCode(!isBackupCode);
    setCode('');
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {isBackupCode 
            ? 'Enter one of your backup codes' 
            : 'Enter the 6-digit code from your authenticator app'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="totp-code">
              {isBackupCode ? 'Backup Code' : 'Verification Code'}
            </Label>
            <div className="relative">
              <Input
                id="totp-code"
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={isBackupCode ? 'Enter backup code' : '123456'}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={isBackupCode ? 8 : 6}
                disabled={loading}
                autoComplete="one-time-code"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isBackupCode ? (
                  <Key className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || code.length !== (isBackupCode ? 8 : 6)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={toggleBackupCode}
              className="text-sm"
            >
              {isBackupCode 
                ? 'Use authenticator app instead' 
                : 'Use backup code instead'
              }
            </Button>
          </div>
        </form>

        {!isBackupCode && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Can't access your authenticator app?
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Use one of your backup codes instead. Each backup code can only be used once.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
