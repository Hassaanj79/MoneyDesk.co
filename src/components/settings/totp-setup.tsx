"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { 
  generateTOTPSecret, 
  enableTOTP, 
  getTOTPStatus, 
  disableTOTP,
  regenerateBackupCodes,
  type TOTPSecret 
} from '@/services/totp';
import { toast } from 'sonner';

export function TOTPSetup() {
  const { user } = useAuth();
  const [totpData, setTotpData] = useState<TOTPSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ isEnabled: boolean; hasSecret: boolean }>({ isEnabled: false, hasSecret: false });

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
    } catch (error) {
      console.error('Error loading TOTP status:', error);
      setError('Failed to load TOTP status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTOTP = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const secret = await generateTOTPSecret(user.uid, user.email || '');
      setTotpData(secret);
      setBackupCodes(secret.backupCodes);
      setShowBackupCodes(true);
      toast.success('TOTP secret generated successfully');
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      setError('Failed to generate TOTP secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTOTP = async () => {
    if (!user || !verificationCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await enableTOTP(user.uid, verificationCode);
      
      if (success) {
        setStatus({ isEnabled: true, hasSecret: true });
        setVerificationCode('');
        toast.success('Two-factor authentication enabled successfully!');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error enabling TOTP:', error);
      setError('Failed to enable TOTP. Please try again.');
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
      setStatus({ isEnabled: false, hasSecret: true });
      setTotpData(null);
      setBackupCodes([]);
      setShowBackupCodes(false);
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      console.error('Error disabling TOTP:', error);
      setError('Failed to disable TOTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newCodes = await regenerateBackupCodes(user.uid);
      setBackupCodes(newCodes);
      toast.success('Backup codes regenerated successfully');
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      setError('Failed to regenerate backup codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const content = `MoneyDesk - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Store these codes in a safe place. Each code can only be used once.\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moneydesk-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with Google Authenticator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Display */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : (status.isEnabled ? 'Enabled' : 'Disabled')}
              </p>
            </div>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge variant={status.isEnabled ? 'default' : 'secondary'}>
              {status.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          )}
        </div>

        {/* Setup Instructions */}
        {!status.isEnabled && !totpData && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="font-medium mb-2">How it works:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Install Google Authenticator on your phone</li>
                <li>• Scan the QR code to add your account</li>
                <li>• Enter the 6-digit code to verify setup</li>
                <li>• Save your backup codes in a safe place</li>
              </ul>
            </div>
            
            <Button onClick={handleSetupTOTP} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </>
              )}
            </Button>
          </div>
        )}

        {/* QR Code and Verification */}
        {totpData && !status.isEnabled && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use Google Authenticator to scan this QR code
              </p>
              <div className="inline-block p-4 bg-white rounded-lg border">
                <img src={totpData.qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter 6-digit code from your authenticator app</Label>
              <div className="flex gap-2">
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <Button 
                  onClick={handleEnableTOTP} 
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Backup Codes</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                >
                  {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showBackupCodes ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Save these backup codes in a safe place. Each code can only be used once.
              </AlertDescription>
            </Alert>

            {showBackupCodes && (
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                    <span className="font-mono text-sm">{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Management Actions */}
        {status.isEnabled && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Two-Factor Authentication is enabled
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account is now protected with an additional layer of security.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerateBackupCodes}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Regenerate Backup Codes'
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisableTOTP}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Disable 2FA'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
