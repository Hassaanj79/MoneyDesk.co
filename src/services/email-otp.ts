import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EMAIL_OTP_COLLECTION = 'email_otp';

export interface EmailOTP {
  email: string;
  otp: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
}

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email (placeholder - you'll need to implement actual email sending)
 */
const sendOTPToEmail = async (email: string, otp: string): Promise<void> => {
  // This is a placeholder - you would implement actual email sending here
  // For now, we'll just log it to console for testing
  console.log(`📧 OTP for ${email}: ${otp}`);
  console.log(`🔗 Verification URL: https://moneydesk.co/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}`);
  
  // In production, you would send an actual email here
  // Example using a service like SendGrid, AWS SES, etc.
  // await sendEmail({
  //   to: email,
  //   subject: 'Your MoneyDesk Verification Code',
  //   html: `
  //     <h2>Email Verification</h2>
  //     <p>Your verification code is: <strong>${otp}</strong></p>
  //     <p>This code will expire in 10 minutes.</p>
  //     <p>If you didn't request this, please ignore this email.</p>
  //   `
  // });
};

/**
 * Create and send OTP for email verification
 */
export const createEmailOTP = async (email: string): Promise<string> => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const otpData: EmailOTP = {
      email,
      otp,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString()
    };

    // Store OTP in Firestore
    await setDoc(doc(db, EMAIL_OTP_COLLECTION, email), otpData);
    
    // Send OTP via email
    await sendOTPToEmail(email, otp);
    
    return otp;
  } catch (error) {
    console.error('Error creating email OTP:', error);
    throw new Error('Failed to create email OTP');
  }
};

/**
 * Verify OTP for email verification
 */
export const verifyEmailOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    const otpDoc = await getDoc(doc(db, EMAIL_OTP_COLLECTION, email));
    
    if (!otpDoc.exists()) {
      throw new Error('OTP not found');
    }

    const otpData = otpDoc.data() as EmailOTP;
    
    // Check if OTP has expired
    if (new Date() > new Date(otpData.expiresAt)) {
      // Clean up expired OTP
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
      throw new Error('OTP has expired');
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= otpData.maxAttempts) {
      // Clean up after max attempts
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
      throw new Error('Maximum attempts exceeded');
    }

    // Increment attempts
    await updateDoc(doc(db, EMAIL_OTP_COLLECTION, email), {
      attempts: otpData.attempts + 1
    });

    // Check if OTP matches
    if (otpData.otp === otp) {
      // Clean up successful OTP
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    throw error;
  }
};

/**
 * Resend OTP for email verification
 */
export const resendEmailOTP = async (email: string): Promise<string> => {
  try {
    // Delete existing OTP if any
    const otpDoc = await getDoc(doc(db, EMAIL_OTP_COLLECTION, email));
    if (otpDoc.exists()) {
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
    }

    // Create new OTP
    return await createEmailOTP(email);
  } catch (error) {
    console.error('Error resending email OTP:', error);
    throw new Error('Failed to resend email OTP');
  }
};

/**
 * Check if OTP exists and is valid (not expired)
 */
export const isEmailOTPValid = async (email: string): Promise<boolean> => {
  try {
    const otpDoc = await getDoc(doc(db, EMAIL_OTP_COLLECTION, email));
    
    if (!otpDoc.exists()) {
      return false;
    }

    const otpData = otpDoc.data() as EmailOTP;
    
    // Check if OTP has expired
    if (new Date() > new Date(otpData.expiresAt)) {
      // Clean up expired OTP
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
      return false;
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= otpData.maxAttempts) {
      // Clean up after max attempts
      await deleteDoc(doc(db, EMAIL_OTP_COLLECTION, email));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking email OTP validity:', error);
    return false;
  }
};
