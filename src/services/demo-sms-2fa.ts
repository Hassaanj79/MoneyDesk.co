// Demo SMS 2FA Service - Non-intrusive implementation
// This service provides a demo version of SMS 2FA without interfering with existing Firebase setup

export interface DemoSMSService {
  sendCode: (phoneNumber: string) => Promise<{ success: boolean; message: string; code?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; message: string }>;
  isAvailable: () => boolean;
}

/**
 * Demo SMS 2FA Service
 * This is a mock service that simulates SMS functionality without using Firebase
 * Perfect for testing and demonstration purposes
 */
export const demoSMSService: DemoSMSService = {
  /**
   * Simulate sending SMS code
   */
  sendCode: async (phoneNumber: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate phone number format
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+') || cleanNumber.length < 10) {
      return {
        success: false,
        message: 'Please enter a valid phone number with country code (e.g., +92 300 1234567)'
      };
    }
    
    // Generate a demo verification code
    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log to console for demo purposes
    console.log('📱 DEMO SMS SENT:');
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Code: ${demoCode}`);
    console.log(`   ⏰ Code expires in 10 minutes`);
    console.log('   (This is a demo - no actual SMS was sent)');
    
    // Store the code temporarily (in a real app, this would be server-side)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demo_sms_code', demoCode);
      sessionStorage.setItem('demo_sms_phone', phoneNumber);
      sessionStorage.setItem('demo_sms_timestamp', Date.now().toString());
    }
    
    return {
      success: true,
      message: `Demo SMS sent to ${phoneNumber}. Check console for the code.`,
      code: demoCode // Only for demo purposes
    };
  },

  /**
   * Verify the demo SMS code
   */
  verifyCode: async (inputCode: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'Verification not available in this environment'
      };
    }
    
    const storedCode = sessionStorage.getItem('demo_sms_code');
    const storedPhone = sessionStorage.getItem('demo_sms_phone');
    const storedTimestamp = sessionStorage.getItem('demo_sms_timestamp');
    
    if (!storedCode || !storedPhone || !storedTimestamp) {
      return {
        success: false,
        message: 'No verification code found. Please request a new code.'
      };
    }
    
    // Check if code has expired (10 minutes)
    const now = Date.now();
    const codeTime = parseInt(storedTimestamp);
    const tenMinutes = 10 * 60 * 1000;
    
    if (now - codeTime > tenMinutes) {
      // Clear expired code
      sessionStorage.removeItem('demo_sms_code');
      sessionStorage.removeItem('demo_sms_phone');
      sessionStorage.removeItem('demo_sms_timestamp');
      
      return {
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      };
    }
    
    // Verify the code
    if (inputCode === storedCode) {
      // Clear the code after successful verification
      sessionStorage.removeItem('demo_sms_code');
      sessionStorage.removeItem('demo_sms_phone');
      sessionStorage.removeItem('demo_sms_timestamp');
      
      console.log('✅ DEMO SMS VERIFICATION SUCCESSFUL');
      console.log(`   Phone: ${storedPhone}`);
      console.log(`   Code: ${inputCode}`);
      
      return {
        success: true,
        message: 'SMS verification successful!'
      };
    } else {
      return {
        success: false,
        message: 'Invalid verification code. Please try again.'
      };
    }
  },

  /**
   * Check if demo SMS service is available
   */
  isAvailable: () => {
    return typeof window !== 'undefined';
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+92')) {
    const digits = cleaned.slice(3);
    if (digits.length >= 10) {
      return `+92 ${digits.slice(0, 3)} ${digits.slice(3, 10)}`;
    }
  } else if (cleaned.startsWith('+1')) {
    const digits = cleaned.slice(2);
    if (digits.length >= 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber: string): { valid: boolean; message?: string } => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    return { valid: false, message: 'Phone number must start with country code (e.g., +92)' };
  }
  
  if (cleaned.length < 10) {
    return { valid: false, message: 'Phone number is too short' };
  }
  
  if (cleaned.length > 15) {
    return { valid: false, message: 'Phone number is too long' };
  }
  
  return { valid: true };
};
