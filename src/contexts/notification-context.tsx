"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { 
  getUserNotifications,
  listenToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification
} from '@/services/notifications';

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Real-time listeners
  startListening: () => void;
  stopListening: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark all notifications as read');
      throw err;
    }
  }, [user]);

  // Delete notification
  const deleteNotificationHandler = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification');
      throw err;
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userNotifications = await getUserNotifications(user.uid);
      setNotifications(userNotifications);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Start listening to notifications
  const startListening = useCallback(() => {
    if (!user) return;

    // Stop existing listener
    if (unsubscribe) {
      unsubscribe();
    }

    // Start new listener
    const unsubscribeFn = listenToUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });

    setUnsubscribe(() => unsubscribeFn);
  }, [user]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationHandler,
    refreshNotifications,
    startListening,
    stopListening
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
