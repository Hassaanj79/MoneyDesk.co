
"use client";

import React, { createContext, useState, ReactNode, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ToastProps } from '@/components/ui/toast';

export interface Notification {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  read: boolean;
  variant?: ToastProps['variant'];
}

type NewNotification = Omit<Notification, 'id' | 'read'>;

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: NewNotification) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const addNotification = useCallback((notification: NewNotification) => {
    const newNotification: Notification = {
      ...notification,
      id: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    const Icon = notification.icon;
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.variant,
      icon: <Icon className="h-5 w-5" />,
    });
  }, [toast]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
