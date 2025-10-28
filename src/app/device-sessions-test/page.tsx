"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Monitor, Smartphone, Tablet, AlertCircle, CheckCircle } from 'lucide-react';
import { useDevice } from '@/contexts/device-context';
import { useAuth } from '@/contexts/auth-context';
import { createOrUpdateDeviceSession, generateDeviceId } from '@/services/device-management';
import { toast } from 'sonner';

export default function DeviceSessionsTest() {
  const { user } = useAuth();
  const { 
    sessions, 
    sessionCount, 
    loading, 
    error, 
    refreshSessions 
  } = useDevice();
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Get device info for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugInfo({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        deviceId: localStorage.getItem('deviceId'),
        userId: user?.uid,
        userEmail: user?.email
      });
    }
  }, [user]);

  const handleCreateTestSession = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setIsCreatingSession(true);
    try {
      const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
      
      const deviceName = `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`;
      const userAgent = navigator.userAgent;
      
      // Mock IP and location for testing
      const ipAddress = '127.0.0.1';
      const location = {
        city: 'Test City',
        country: 'Test Country',
        region: 'Test Region'
      };
      
      console.log('Creating test device session:', {
        userId: user.uid,
        deviceId,
        deviceName,
        userAgent,
        ipAddress,
        location
      });
      
      const sessionId = await createOrUpdateDeviceSession(
        user.uid,
        deviceId,
        deviceName,
        userAgent,
        ipAddress,
        location,
        false
      );
      
      console.log('Test session created with ID:', sessionId);
      toast.success('Test session created successfully!');
      
      // Refresh sessions to show the new one
      await refreshSessions();
      
    } catch (error: any) {
      console.error('Error creating test session:', error);
      toast.error(`Failed to create test session: ${error.message}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-6 w-6 text-blue-500" />;
      case 'tablet':
        return <Tablet className="h-6 w-6 text-purple-500" />;
      default:
        return <Monitor className="h-6 w-6 text-green-500" />;
    }
  };

  const formatLastActivity = (lastActivity: any) => {
    if (!lastActivity) return 'Unknown';
    
    try {
      const date = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔐 Device Sessions Test</h1>
          <p className="text-xl text-gray-600">Test and debug device session management</p>
        </div>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Debug Information
            </CardTitle>
            <CardDescription>Current user and device information</CardDescription>
          </CardHeader>
          <CardContent>
            {debugInfo ? (
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {debugInfo.userId || 'Not logged in'}</div>
                <div><strong>User Email:</strong> {debugInfo.userEmail || 'Not logged in'}</div>
                <div><strong>Device ID:</strong> {debugInfo.deviceId || 'Not set'}</div>
                <div><strong>Platform:</strong> {debugInfo.platform}</div>
                <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading debug information...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Create test sessions and refresh data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleCreateTestSession}
                disabled={isCreatingSession || !user}
                className="flex items-center gap-2"
              >
                {isCreatingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Create Test Session
              </Button>
              
              <Button 
                onClick={refreshSessions}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Sessions
              </Button>
            </div>
            
            {!user && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please log in to test device session creation.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Active Sessions
              </div>
              <Badge variant="secondary" className="text-sm">
                {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center space-x-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Sessions
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  You don't have any active device sessions at the moment.
                </p>
                <Button onClick={handleCreateTestSession} disabled={!user}>
                  Create Test Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {session.deviceName}
                              </h4>
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                {session.deviceType}
                              </Badge>
                              {session.isRemembered && (
                                <Badge variant="secondary" className="text-xs">
                                  Remembered
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center space-x-1">
                                <span>🌐 {session.browser} on {session.os}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span>📍 {session.location.city}, {session.location.country}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span>🕒 Last active {formatLastActivity(session.lastActivity)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span>🆔 Device ID: {session.deviceId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {session.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test Device Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🔐</div>
                <h3 className="font-medium mb-1">1. Login</h3>
                <p className="text-sm text-gray-600">Log in to your account to create a session</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📱</div>
                <h3 className="font-medium mb-1">2. Create Session</h3>
                <p className="text-sm text-gray-600">Click "Create Test Session" to add a new session</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">👀</div>
                <h3 className="font-medium mb-1">3. View Sessions</h3>
                <p className="text-sm text-gray-600">See all your active device sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
