// Firebase SMS 2FA Service - Separate implementation
// This service provides Firebase SMS 2FA without interfering with existing code

import { 
  getAuth, 
  PhoneAuthProvider, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface FirebaseSMSResult {
  success: boolean;
  message: string;
  verificationId?: string;
  confirmationResult?: ConfirmationResult;
}

/**
 * Initialize reCAPTCHA verifier for Firebase SMS 2FA
 */
export const initializeFirebaseRecaptcha = (containerId: string): RecaptchaVerifier => {
  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('Firebase reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('Firebase reCAPTCHA expired');
      }
    });
  } catch (error) {
    console.error('Error initializing Firebase reCAPTCHA:', error);
    throw new Error('Failed to initialize reCAPTCHA. Please check Firebase configuration.');
  }
};

/**
 * Send SMS verification code using Firebase
 */
export const sendFirebaseSMS = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<FirebaseSMSResult> => {
  try {
    console.log('Sending Firebase SMS to:', phoneNumber);
    
    // Validate phone number format
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+') || cleanNumber.length < 10) {
      return {
        success: false,
        message: 'Please enter a valid phone number with country code (e.g., +92 300 1234567)'
      };
    }

    // Use Firebase Phone Auth
    const confirmationResult = await signInWithPhoneNumber(auth, cleanNumber, recaptchaVerifier);
    
    console.log('Firebase SMS sent successfully');

    return {
      success: true,
      message: 'SMS verification code sent successfully',
      confirmationResult
    };
  } catch (error: any) {
    console.error('Firebase SMS error:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to send SMS verification code';
    
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Phone authentication is not enabled in Firebase Console. Please contact support.';
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format. Please check and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.code === 'auth/invalid-app-credential') {
      errorMessage = 'Firebase configuration error. Please refresh the page and try again.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'reCAPTCHA verification failed. Please try again.';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'SMS quota exceeded. Please try again later.';
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
 * Verify SMS code using Firebase
 */
export const verifyFirebaseSMS = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<FirebaseSMSResult> => {
  try {
    console.log('Verifying Firebase SMS code:', verificationCode);
    
    // Verify the code with Firebase
    const result = await confirmationResult.confirm(verificationCode);
    
    console.log('Firebase SMS verification successful:', result.user.phoneNumber);

    return {
      success: true,
      message: 'SMS verification successful!',
      confirmationResult
    };
  } catch (error: any) {
    console.error('Firebase SMS verification error:', error);
    
    let errorMessage = 'Failed to verify SMS code';
    
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Invalid verification code. Please check and try again.';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'Verification code has expired. Please request a new code.';
    } else if (error.code === 'auth/invalid-verification-id') {
      errorMessage = 'Invalid verification session. Please request a new code.';
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
 * Check if Firebase SMS is available
 */
export const isFirebaseSMSAvailable = (): boolean => {
  try {
    // Check if auth instance is available
    if (!auth) {
      console.log('Firebase auth not available');
      return false;
    }
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return false;
    }
    
    // Check if Firebase is properly configured
    if (!auth.config || !auth.config.apiKey) {
      console.log('Firebase not properly configured');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Firebase SMS availability:', error);
    return false;
  }
};

/**
 * Get Firebase configuration status
 */
export const getFirebaseConfigStatus = () => {
  try {
    if (!auth) {
      return { available: false, message: 'Firebase auth not initialized' };
    }
    
    if (!auth.config) {
      return { available: false, message: 'Firebase config not found' };
    }
    
    const config = auth.config;
    return {
      available: true,
      projectId: config.projectId,
      apiKey: config.apiKey ? 'Set' : 'Not set',
      authDomain: config.authDomain,
      message: 'Firebase is properly configured'
    };
  } catch (error) {
    return { available: false, message: 'Error checking Firebase configuration' };
  }
};

/**
 * Format phone number for Firebase
 */
export const formatPhoneForFirebase = (phoneNumber: string): string => {
  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number for Firebase
 */
export const validatePhoneForFirebase = (phoneNumber: string): { valid: boolean; message?: string; formatted?: string } => {
  const formatted = formatPhoneForFirebase(phoneNumber);
  
  if (!formatted.startsWith('+')) {
    return { valid: false, message: 'Phone number must start with country code (e.g., +92)' };
  }
  
  if (formatted.length < 10) {
    return { valid: false, message: 'Phone number is too short' };
  }
  
  if (formatted.length > 15) {
    return { valid: false, message: 'Phone number is too long' };
  }
  
  // Check for valid country codes
  const validCountryCodes = ['+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95', '+98', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+684', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692', '+850', '+852', '+853', '+855', '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998'];
  
  const countryCode = formatted.substring(0, 4);
  const hasValidCountryCode = validCountryCodes.some(code => formatted.startsWith(code));
  
  if (!hasValidCountryCode) {
    return { valid: false, message: 'Invalid country code. Please check your phone number.' };
  }
  
  return { valid: true, formatted };
};
