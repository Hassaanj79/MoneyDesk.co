"use client";

import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  AlertTriangle, 
  UserX, 
  Settings, 
  CheckCircle, 
  XCircle,
  Info,
  Bell,
  DollarSign,
  Target,
  CreditCard,
  Shield,
  User,
  FileText,
  Download,
  RefreshCw,
  Wrench,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export function ToastNotifications() {
  const { notifications, unreadCount } = useNotifications();
  const { user } = useAuth();

  // Track shown notifications to avoid duplicates
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show toast for new unread notifications
    if (unreadCount > 0) {
      const latestUnread = notifications
        .filter(n => !n.isRead && !shownNotifications.has(n.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (latestUnread) {
        showNotificationToast(latestUnread);
        setShownNotifications(prev => new Set(prev).add(latestUnread.id));
      }
    }
  }, [notifications, unreadCount, shownNotifications]);

  const showNotificationToast = (notification: any) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'chat_reply':
          return <MessageSquare className="h-4 w-4" />;
        case 'cancellation_request':
          return <UserX className="h-4 w-4" />;
        case 'admin_alert':
          return <AlertTriangle className="h-4 w-4" />;
        case 'system':
          return <Settings className="h-4 w-4" />;
        case 'transaction':
          return <DollarSign className="h-4 w-4" />;
        case 'budget':
          return <Target className="h-4 w-4" />;
        case 'account':
          return <CreditCard className="h-4 w-4" />;
        case 'loan':
          return <TrendingUp className="h-4 w-4" />;
        case 'security':
          return <Shield className="h-4 w-4" />;
        case 'profile':
          return <User className="h-4 w-4" />;
        case 'settings':
          return <Settings className="h-4 w-4" />;
        case 'report':
          return <FileText className="h-4 w-4" />;
        case 'backup':
          return <Download className="h-4 w-4" />;
        case 'sync':
          return <RefreshCw className="h-4 w-4" />;
        case 'update':
          return <CheckCircle className="h-4 w-4" />;
        case 'maintenance':
          return <Wrench className="h-4 w-4" />;
        default:
          return <Bell className="h-4 w-4" />;
      }
    };

    const getToastType = () => {
      switch (notification.priority) {
        case 'urgent':
          return 'error';
        case 'high':
          return 'warning';
        case 'medium':
          return 'info';
        case 'low':
          return 'success';
        default:
          return 'info';
      }
    };

    const getAction = () => {
      switch (notification.type) {
        case 'chat_reply':
          return {
            label: 'View Chat',
            onClick: () => {
              const chatWidget = document.querySelector('[data-chat-widget]');
              if (chatWidget) {
                (chatWidget as HTMLElement).click();
              }
            }
          };
        case 'cancellation_request':
        case 'admin_alert':
          return {
            label: 'View Admin',
            onClick: () => {
              window.location.href = '/admin';
            }
          };
        case 'transaction':
          return {
            label: 'View Transactions',
            onClick: () => {
              window.location.href = '/transactions';
            }
          };
        case 'budget':
          return {
            label: 'View Budgets',
            onClick: () => {
              window.location.href = '/budgets';
            }
          };
        case 'account':
          return {
            label: 'View Accounts',
            onClick: () => {
              window.location.href = '/accounts';
            }
          };
        case 'loan':
          return {
            label: 'View Loans',
            onClick: () => {
              window.location.href = '/loans';
            }
          };
        case 'security':
        case 'profile':
        case 'settings':
          return {
            label: 'View Settings',
            onClick: () => {
              window.location.href = '/settings';
            }
          };
        case 'report':
          return {
            label: 'View Reports',
            onClick: () => {
              window.location.href = '/reports';
            }
          };
        default:
          return null;
      }
    };

    const action = getAction();

    toast[getToastType()](notification.title, {
      description: notification.message,
      icon: getIcon(),
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      className: 'notification-toast',
    });
  };

  return null; // This component doesn't render anything, it just handles toasts
}
