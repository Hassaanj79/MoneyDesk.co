import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendLoginNotification } from '@/services/login-notifications';
import { toast } from 'sonner';

export default function LoginNotificationTest() {
  const [email, setEmail] = useState('hassyku786@gmail.com');
  const [name, setName] = useState('Test User');
  const [loading, setLoading] = useState(false);

  const handleSendTestNotification = async () => {
    if (!email || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await sendLoginNotification({
        userEmail: email,
        userName: name,
        loginTime: new Date().toLocaleString(),
        deviceInfo: 'Windows PC (Chrome)',
        location: 'New York, NY',
        ipAddress: '192.168.1.100'
      });

      if (result.success) {
        toast.success('Login notification sent successfully!');
      } else {
        toast.error(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔐 Login Notification Test</CardTitle>
          <CardDescription>
            Test the login notification system by sending a sample email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">User Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <Button 
            onClick={handleSendTestNotification}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Login Notification'}
          </Button>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sends a security alert email</li>
              <li>Shows device and login details</li>
              <li>Provides security recommendations</li>
              <li>Includes action buttons for account security</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
