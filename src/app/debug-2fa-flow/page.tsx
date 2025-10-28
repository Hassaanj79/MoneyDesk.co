import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TwoFADebug() {
  const [sessionStatus, setSessionStatus] = useState('');

  const checkSessionStatus = () => {
    const verified = sessionStorage.getItem('2fa_verified');
    setSessionStatus(verified || 'Not set');
    toast.success(`Session status: ${verified || 'Not set'}`);
  };

  const clearSession = () => {
    sessionStorage.removeItem('2fa_verified');
    setSessionStatus('Cleared');
    toast.success('Session storage cleared! Now log out and log back in to test 2FA flow.');
  };

  const setSessionVerified = () => {
    sessionStorage.setItem('2fa_verified', 'true');
    setSessionStatus('true');
    toast.success('Session marked as verified');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔍 2FA Debug Tools</CardTitle>
          <CardDescription>
            Debug and test the 2FA flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Current Session Status:</strong> {sessionStatus || 'Not checked'}
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={checkSessionStatus} className="w-full">
              Check Session Status
            </Button>

            <Button onClick={clearSession} variant="destructive" className="w-full">
              Clear Session Storage
            </Button>

            <Button onClick={setSessionVerified} variant="secondary" className="w-full">
              Mark Session as Verified
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>How to test 2FA flow:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Clear Session Storage"</li>
              <li>Log out of your account</li>
              <li>Log back in</li>
              <li>You should see the 2FA verification screen</li>
              <li>Check your email for the verification code</li>
              <li>Enter the code to complete login</li>
            </ol>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Debug info:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check browser console for detailed logs</li>
              <li>Look for "🔍 2FA Debug:" messages</li>
              <li>Debug panel shows in bottom-right corner</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
