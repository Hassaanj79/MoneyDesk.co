"use client";

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  Check, 
  Trash2,
  MessageSquare,
  AlertTriangle,
  UserX,
  Settings,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId);
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setActionLoading(notificationId);
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_reply':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'cancellation_request':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'admin_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("relative overflow-visible", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 p-0 overflow-visible"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-background shadow-sm z-10 px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-sans">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      onClick={handleMarkAllAsRead}
                      variant="ghost"
                      size="sm"
                      disabled={actionLoading === 'all'}
                      className="text-xs h-6 px-2"
                    >
                      {actionLoading === 'all' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Mark all read
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600 text-sm">
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                        !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium font-sans truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs h-4 px-1", getPriorityColor(notification.priority))}
                              >
                                {notification.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-sans">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground font-sans mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                onClick={() => handleMarkAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === notification.id}
                                className="text-xs h-6 px-2"
                              >
                                {actionLoading === notification.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                Mark read
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(notification.id)}
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === notification.id}
                              className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
