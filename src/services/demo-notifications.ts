import { 
  createNotification,
  type Notification 
} from './notifications';

// Demo function to create sample notifications
export const createDemoNotifications = async (userId: string) => {
  const demoNotifications = [
    {
      type: 'transaction' as const,
      title: 'Transaction Added',
      message: 'A new expense of $25.50 has been added to your account',
      priority: 'medium' as const,
      data: { transactionId: 'demo-1' }
    },
    {
      type: 'budget' as const,
      title: 'Budget Alert',
      message: 'You\'ve spent 80% of your monthly food budget',
      priority: 'high' as const,
      data: { budgetId: 'demo-1' }
    },
    {
      type: 'chat_reply' as const,
      title: 'New Message',
      message: 'You have a new message from support',
      priority: 'medium' as const,
      data: { conversationId: 'demo-1' }
    },
    {
      type: 'security' as const,
      title: 'Security Update',
      message: 'Your password has been successfully changed',
      priority: 'low' as const,
      data: {}
    },
    {
      type: 'account' as const,
      title: 'Account Connected',
      message: 'Your bank account has been successfully linked',
      priority: 'medium' as const,
      data: { accountId: 'demo-1' }
    },
    {
      type: 'loan' as const,
      title: 'Loan Payment Due',
      message: 'Your loan payment of $150 is due in 3 days',
      priority: 'high' as const,
      data: { loanId: 'demo-1' }
    },
    {
      type: 'report' as const,
      title: 'Monthly Report Ready',
      message: 'Your monthly financial report is now available',
      priority: 'low' as const,
      data: { reportId: 'demo-1' }
    },
    {
      type: 'system' as const,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 2 AM',
      priority: 'medium' as const,
      data: {}
    }
  ];

  // Create notifications with delays to simulate real-time
  for (let i = 0; i < demoNotifications.length; i++) {
    setTimeout(async () => {
      try {
        const notification = demoNotifications[i];
        await createNotification(
          userId,
          notification.type,
          notification.title,
          notification.message,
          notification.data,
          notification.priority
        );
        console.log(`Demo notification ${i + 1} created`);
      } catch (error) {
        console.error('Error creating demo notification:', error);
      }
    }, i * 3000); // 3 seconds between each notification
  }
};

// Function to create a single demo notification
export const createSingleDemoNotification = async (userId: string, type: Notification['type']) => {
  const notificationTemplates: Record<string, {
    title: string;
    message: string;
    priority: Notification['priority'];
    data: Notification['data'];
  }> = {
    transaction: {
      title: 'New Transaction',
      message: 'A new transaction has been added to your account',
      priority: 'medium',
      data: { transactionId: 'demo-' + Date.now() }
    },
    budget: {
      title: 'Budget Alert',
      message: 'You\'re approaching your budget limit',
      priority: 'high',
      data: { budgetId: 'demo-' + Date.now() }
    },
    chat_reply: {
      title: 'New Message',
      message: 'You have a new message from support',
      priority: 'medium',
      data: { conversationId: 'demo-' + Date.now() }
    },
    security: {
      title: 'Security Alert',
      message: 'Unusual activity detected on your account',
      priority: 'urgent',
      data: {}
    },
    system: {
      title: 'System Update',
      message: 'A new update is available for the app',
      priority: 'low',
      data: {}
    }
  };

  const template = notificationTemplates[type];
  if (template) {
    try {
      await createNotification(
        userId,
        type,
        template.title,
        template.message,
        template.data,
        template.priority
      );
      console.log(`Demo ${type} notification created`);
    } catch (error) {
      console.error('Error creating demo notification:', error);
    }
  }
};
