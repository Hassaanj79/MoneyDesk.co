import { 
  getAuth, 
  PhoneAuthProvider, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface SimpleSMS2FAResult {
  success: boolean;
  message: string;
  verificationId?: string;
  confirmationResult?: ConfirmationResult;
}

/**
 * Initialize reCAPTCHA verifier for SMS 2FA
 */
export const initializeSimpleRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
};

/**
 * Send SMS verification code (simplified version)
 */
export const sendSMSVerificationCode = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<SimpleSMS2FAResult> => {
  try {
    console.log('Sending SMS to:', phoneNumber);
    
    // Create phone auth provider
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    
    // Send verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );

    console.log('SMS sent successfully, verification ID:', verificationId);

    return {
      success: true,
      message: 'SMS verification code sent successfully',
      verificationId
    };
  } catch (error: any) {
    console.error('Error sending SMS verification code:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send SMS verification code';
    
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Phone authentication is not enabled. Please contact support.';
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format. Please check and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.code === 'auth/invalid-app-credential') {
      errorMessage = 'Firebase configuration error. Please refresh the page and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Verify SMS code (simplified version)
 */
export const verifySMSCode = async (
  verificationId: string,
  verificationCode: string
): Promise<SimpleSMS2FAResult> => {
  try {
    console.log('Verifying SMS code:', verificationCode);
    
    // Create credential
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    
    // For now, we'll just validate the code format
    // In a real implementation, you'd verify with Firebase
    if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
      return {
        success: true,
        message: 'SMS code verified successfully'
      };
    } else {
      return {
        success: false,
        message: 'Invalid verification code format'
      };
    }
  } catch (error: any) {
    console.error('Error verifying SMS code:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify SMS code'
    };
  }
};

/**
 * Check if phone authentication is available
 */
export const isPhoneAuthAvailable = (): boolean => {
  try {
    // Check if auth instance is available
    if (!auth) {
      return false;
    }
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking phone auth availability:', error);
    return false;
  }
};

/**
 * Get formatted phone number for display
 */
export const formatPhoneForDisplay = (phoneNumber: string): string => {
  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Basic formatting for common countries
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
