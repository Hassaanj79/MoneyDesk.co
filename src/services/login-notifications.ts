// Login notification service
export interface LoginNotificationData {
  userEmail: string;
  userName: string;
  loginTime?: string;
  deviceInfo?: string;
  location?: string;
  ipAddress?: string;
}

/**
 * Send login notification email to user
 */
export const sendLoginNotification = async (data: LoginNotificationData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/auth/login-notification', {
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
        message: error.error || 'Failed to send login notification' 
      };
    }

    const result = await response.json();
    return { 
      success: result.success, 
      message: result.message || 'Login notification sent successfully' 
    };
  } catch (error) {
    console.error('Error sending login notification:', error);
    return { success: false, message: 'Failed to send login notification' };
  }
};

/**
 * Get device information from user agent
 */
export const getDeviceInfo = (userAgent: string): string => {
  // Simple device detection based on user agent
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Phone';
    return 'Mobile Device';
  }
  
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return 'Tablet';
  }
  
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  
  return 'Unknown Device';
};

/**
 * Get browser information from user agent
 */
export const getBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
};

/**
 * Format device info for display
 */
export const formatDeviceInfo = (userAgent: string): string => {
  const device = getDeviceInfo(userAgent);
  const browser = getBrowserInfo(userAgent);
  return `${device} (${browser})`;
};
