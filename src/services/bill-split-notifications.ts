// Bill split notification service
export interface BillSplitNotificationData {
  participantEmail: string;
  participantName?: string;
  poolName: string;
  totalAmount: number;
  participantShare: number;
  totalParticipants: number;
  addedBy: string;
  addedByName?: string;
  currency?: string;
}

/**
 * Send bill split notification email to participant
 */
export const sendBillSplitNotification = async (data: BillSplitNotificationData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/pools/bill-split-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error || 'Failed to send bill split notification' 
      };
    }

    const result = await response.json();
    return { 
      success: result.success, 
      message: result.message || 'Bill split notification sent successfully' 
    };
  } catch (error) {
    console.error('Error sending bill split notification:', error);
    return { success: false, message: 'Failed to send bill split notification' };
  }
};

/**
 * Calculate participant share amount
 */
export const calculateParticipantShare = (totalAmount: number, totalParticipants: number): number => {
  if (totalParticipants <= 0) return 0;
  return totalAmount / totalParticipants;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
