import { 
  getAuth, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  MultiFactorResolver,
  getMultiFactorResolver
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface SMS2FAConfig {
  phoneNumber: string;
  recaptchaContainerId: string;
}

export interface SMS2FAEnrollmentResult {
  success: boolean;
  message: string;
  verificationId?: string;
}

export interface SMS2FAVerificationResult {
  success: boolean;
  message: string;
  userCredential?: any;
}

/**
 * Initialize reCAPTCHA verifier for SMS 2FA
 */
export const initializeRecaptcha = (containerId: string): RecaptchaVerifier => {
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
 * Enroll user in SMS 2FA
 */
export const enrollSMS2FA = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<SMS2FAEnrollmentResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Create phone auth provider
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    
    // Send verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );

    return {
      success: true,
      message: 'SMS verification code sent',
      verificationId
    };
  } catch (error: any) {
    console.error('Error enrolling SMS 2FA:', error);
    return {
      success: false,
      message: error.message || 'Failed to send SMS verification code'
    };
  }
};

/**
 * Complete SMS 2FA enrollment
 */
export const completeSMS2FAEnrollment = async (
  verificationId: string,
  verificationCode: string
): Promise<SMS2FAEnrollmentResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Create credential
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    
    // Create multi-factor assertion
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
    
    // Enroll the second factor
    await user.multiFactor.enroll(multiFactorAssertion, 'SMS 2FA');

    return {
      success: true,
      message: 'SMS 2FA enrolled successfully'
    };
  } catch (error: any) {
    console.error('Error completing SMS 2FA enrollment:', error);
    return {
      success: false,
      message: error.message || 'Failed to complete SMS 2FA enrollment'
    };
  }
};

/**
 * Handle sign-in with SMS 2FA
 */
export const signInWithSMS2FA = async (
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string
): Promise<SMS2FAVerificationResult> => {
  try {
    // Create credential
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    
    // Create multi-factor assertion
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
    
    // Complete sign-in
    const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

    return {
      success: true,
      message: 'Sign-in successful',
      userCredential
    };
  } catch (error: any) {
    console.error('Error signing in with SMS 2FA:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify SMS code'
    };
  }
};

/**
 * Check if user has SMS 2FA enrolled
 */
export const hasSMS2FAEnrolled = (): boolean => {
  const user = auth.currentUser;
  
  if (!user || !user.multiFactor) {
    return false;
  }

  return user.multiFactor.enrolledFactors.some(
    factor => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID
  );
};

/**
 * Unenroll SMS 2FA
 */
export const unenrollSMS2FA = async (): Promise<SMS2FAEnrollmentResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.multiFactor) {
      return { success: false, message: 'User not authenticated or no MFA enrolled' };
    }

    // Find SMS factor
    const smsFactor = user.multiFactor.enrolledFactors.find(
      factor => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID
    );

    if (!smsFactor) {
      return { success: false, message: 'SMS 2FA not enrolled' };
    }

    // Unenroll the factor
    await user.multiFactor.unenroll(smsFactor);

    return {
      success: true,
      message: 'SMS 2FA unenrolled successfully'
    };
  } catch (error: any) {
    console.error('Error unenrolling SMS 2FA:', error);
    return {
      success: false,
      message: error.message || 'Failed to unenroll SMS 2FA'
    };
  }
};
