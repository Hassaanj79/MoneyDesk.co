"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Shield, Key } from 'lucide-react';
import { 
  generateTOTPSecret, 
  verifyTOTPCode, 
  enableTOTP, 
  getTOTPStatus, 
  disableTOTP,
  type TOTPSecret 
} from '@/services/totp-alt';
import { toast } from 'sonner';

export function TOTPDebug() {
  const { user } = useAuth();
  const [totpData, setTotpData] = useState<TOTPSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ isEnabled: boolean; hasSecret: boolean }>({ isEnabled: false, hasSecret: false });
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadTOTPStatus();
    }
  }, [user]);

  const loadTOTPStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const totpStatus = await getTOTPStatus(user.uid);
      setStatus(totpStatus);
      console.log('TOTP Status loaded:', totpStatus);
    } catch (error) {
      console.error('Error loading TOTP status:', error);
      setError('Failed to load TOTP status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTOTP = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const newTotpData = await generateTOTPSecret(user.uid, user.email || '');
      setTotpData(newTotpData);
      setStatus({ isEnabled: false, hasSecret: true });
      toast.success('TOTP secret generated. Please scan the QR code.');
      console.log('TOTP secret generated:', newTotpData);
    } catch (err: any) {
      setError(err.message || 'Failed to generate TOTP secret.');
      toast.error('Failed to generate TOTP secret.');
      console.error('Error generating TOTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!user || !verificationCode) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Verifying TOTP code:', verificationCode);
      const success = await enableTOTP(user.uid, verificationCode);
      
      if (success) {
        setStatus({ isEnabled: true, hasSecret: true });
        setVerificationCode('');
        toast.success('Two-Factor Authentication enabled successfully!');
        console.log('TOTP enabled successfully');
      } else {
        setError('Invalid verification code. Please try again.');
        console.log('TOTP verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify TOTP code.');
      toast.error('Failed to verify TOTP code.');
      console.error('Error verifying TOTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestVerification = async () => {
    if (!user || !testCode) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Testing TOTP verification with code:', testCode);
      const result = await verifyTOTPCode(user.uid, testCode);
      console.log('TOTP verification result:', result);
      
      if (result.valid) {
        toast.success('TOTP verification successful!');
        setDebugInfo({ lastTest: 'success', result });
      } else {
        setError('Invalid TOTP code. Please try again.');
        setDebugInfo({ lastTest: 'failed', result });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify TOTP code.');
      toast.error('Failed to verify TOTP code.');
      console.error('Error testing TOTP:', err);
      setDebugInfo({ lastTest: 'error', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      await disableTOTP(user.uid);
      setStatus({ isEnabled: false, hasSecret: false });
      setTotpData(null);
      toast.success('Two-Factor Authentication disabled.');
      console.log('TOTP disabled successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to disable TOTP.');
      toast.error('Failed to disable TOTP.');
      console.error('Error disabling TOTP:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            TOTP Debug Panel
          </CardTitle>
          <CardDescription>
            Debug TOTP (Google Authenticator) verification issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-2">
            <h3 className="font-semibold">Current TOTP Status</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p><strong>User ID:</strong> {user?.uid || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Has Secret:</strong> {status.hasSecret ? 'Yes' : 'No'}</p>
              <p><strong>Is Enabled:</strong> {status.isEnabled ? 'Yes' : 'No'}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Generate TOTP */}
          <div className="space-y-2">
            <h3 className="font-semibold">Generate TOTP Secret</h3>
            <Button
              onClick={handleGenerateTOTP}
              disabled={loading || status.hasSecret}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              {status.hasSecret ? 'TOTP Secret Already Generated' : 'Generate TOTP Secret'}
            </Button>
          </div>

          {/* QR Code Display */}
          {totpData && (
            <div className="space-y-2">
              <h3 className="font-semibold">QR Code</h3>
              <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                <img src={totpData.qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Secret: <code className="font-mono text-primary">{totpData.secret}</code></p>
              </div>
            </div>
          )}

          {/* Verify TOTP */}
          {totpData && !status.isEnabled && (
            <div className="space-y-2">
              <h3 className="font-semibold">Verify TOTP Code</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  onClick={handleVerifyTOTP}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Verify
                </Button>
              </div>
            </div>
          )}

          {/* Test TOTP Verification */}
          {status.isEnabled && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test TOTP Verification</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="6-digit code or backup code"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  maxLength={8}
                  className="flex-1"
                />
                <Button
                  onClick={handleTestVerification}
                  disabled={loading || testCode.length < 6}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          )}

          {/* Disable TOTP */}
          {status.isEnabled && (
            <div className="space-y-2">
              <h3 className="font-semibold">Disable TOTP</h3>
              <Button
                onClick={handleDisableTOTP}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Disable Two-Factor Authentication
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug Information */}
          {debugInfo && (
            <div className="space-y-2">
              <h3 className="font-semibold">Debug Information</h3>
              <div className="p-3 bg-gray-100 rounded text-sm">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Backup Codes */}
          {totpData && totpData.backupCodes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Backup Codes</h3>
              <div className="p-3 bg-gray-100 rounded text-sm">
                <p className="mb-2">Save these backup codes in a safe place:</p>
                <div className="grid grid-cols-2 gap-2">
                  {totpData.backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-xs bg-white p-2 rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
