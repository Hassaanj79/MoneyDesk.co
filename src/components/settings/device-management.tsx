"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  Clock, 
  LogOut, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe
} from "lucide-react";
import { useDevice } from "@/contexts/device-context";
import { DeviceSession } from "@/services/device-management";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    case 'desktop':
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const getDeviceTypeColor = (deviceType: string) => {
  switch (deviceType) {
    case 'mobile':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'tablet':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'desktop':
    default:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
};

const formatLastActivity = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

const DeviceCard = ({ session, onToggleRemember, onEndSession, isCurrentDevice }: {
  session: DeviceSession;
  onToggleRemember: (sessionId: string, isRemembered: boolean) => void;
  onEndSession: (sessionId: string) => void;
  isCurrentDevice: boolean;
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleToggleRemember = async () => {
    setIsToggling(true);
    try {
      await onToggleRemember(session.id, !session.isRemembered);
      toast.success(session.isRemembered ? 'Device will not be remembered' : 'Device will be remembered');
    } catch (error) {
      toast.error('Failed to update remember setting');
    } finally {
      setIsToggling(false);
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await onEndSession(session.id);
      toast.success('Session ended successfully');
    } catch (error) {
      toast.error('Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Card className={`${isCurrentDevice ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getDeviceIcon(session.deviceType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {session.deviceName}
                </h4>
                {isCurrentDevice && (
                  <Badge variant="secondary" className="text-xs">
                    Current Device
                  </Badge>
                )}
                <Badge className={`text-xs ${getDeviceTypeColor(session.deviceType)}`}>
                  {session.deviceType}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>{session.browser} on {session.os}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{session.location.city}, {session.location.country}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Last active {formatLastActivity(session.lastActivity)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Remember</span>
              <Switch
                checked={session.isRemembered}
                onCheckedChange={handleToggleRemember}
                disabled={isToggling || isCurrentDevice}
                size="sm"
              />
            </div>
            
            {!isCurrentDevice && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndSession}
                disabled={isEnding}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isEnding ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <LogOut className="h-3 w-3" />
                )}
                <span className="ml-1">End</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function DeviceManagement() {
  const { 
    sessions, 
    sessionCount, 
    loading, 
    error, 
    toggleRememberMeForSession, 
    endSessionById, 
    endAllUserSessions,
    refreshSessions 
  } = useDevice();
  
  const [isEndingAll, setIsEndingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current device ID from localStorage
  const currentDeviceId = typeof window !== 'undefined' 
    ? localStorage.getItem('deviceId') || 'unknown'
    : 'unknown';

  const handleEndAllSessions = async () => {
    setIsEndingAll(true);
    try {
      await endAllUserSessions();
      toast.success('All sessions ended successfully');
    } catch (error) {
      toast.error('Failed to end all sessions');
    } finally {
      setIsEndingAll(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSessions();
      toast.success('Sessions refreshed');
    } catch (error) {
      toast.error('Failed to refresh sessions');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading device sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Device Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your connected devices and active sessions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>
          
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndAllSessions}
              disabled={isEndingAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isEndingAll ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="ml-1">End All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Sessions Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Active Sessions
              </span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Device Sessions */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Active Sessions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You don't have any active device sessions at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <DeviceCard
              key={session.id}
              session={session}
              onToggleRemember={toggleRememberMeForSession}
              onEndSession={endSessionById}
              isCurrentDevice={session.deviceId === currentDeviceId}
            />
          ))
        )}
      </div>

      {/* Remember Me Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Remember Me
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When enabled, you'll stay logged in on this device even after closing your browser. 
                You can disable this for any device at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
