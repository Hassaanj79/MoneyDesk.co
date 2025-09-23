"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createSingleDemoNotification } from '@/services/demo-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MessageSquare, 
  DollarSign, 
  Target, 
  Shield, 
  Settings,
  Loader2
} from 'lucide-react';

export function DemoNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const notificationTypes = [
    { type: 'transaction', label: 'Transaction', icon: DollarSign, color: 'bg-green-500' },
    { type: 'budget', label: 'Budget Alert', icon: Target, color: 'bg-yellow-500' },
    { type: 'chat_reply', label: 'Chat Message', icon: MessageSquare, color: 'bg-blue-500' },
    { type: 'security', label: 'Security Alert', icon: Shield, color: 'bg-red-500' },
    { type: 'system', label: 'System Update', icon: Settings, color: 'bg-gray-500' },
  ];

  const handleDemoNotification = async (type: string) => {
    if (!user) return;
    
    setLoading(type);
    try {
      await createSingleDemoNotification(user.uid, type as any);
    } catch (error) {
      console.error('Error creating demo notification:', error);
    } finally {
      setLoading(null);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Demo Notifications
        </CardTitle>
        <CardDescription>
          Test popup notifications for different events. Click any button to trigger a notification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notificationTypes.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant="outline"
              onClick={() => handleDemoNotification(type)}
              disabled={loading === type}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {loading === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </>
              )}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Notifications will appear as popup toasts in the top-right corner of your screen. 
            Each notification includes an action button to navigate to the relevant page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
