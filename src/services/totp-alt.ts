import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TOTP_COLLECTION = 'user_totp';

export interface TOTPSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  isEnabled: boolean;
  createdAt: string;
}

export interface TOTPVerificationResult {
  valid: boolean;
  backupCodeUsed?: boolean;
  remainingBackupCodes?: number;
}

/**
 * Generate a new TOTP secret for a user
 */
export const generateTOTPSecret = async (userId: string, userEmail: string): Promise<TOTPSecret> => {
  try {
    console.log('Generating TOTP secret for user:', userId, 'email:', userEmail);
    
    // Generate a new secret using otplib
    const secret = authenticator.generateSecret();
    console.log('Secret generated, length:', secret.length);

    // Create the OTP auth URL
    const otpAuthUrl = authenticator.keyuri(userEmail, 'MoneyDesk', secret);
    console.log('OTP Auth URL created');

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    console.log('QR code generated');

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    console.log('Backup codes generated:', backupCodes.length);

    const totpData: TOTPSecret = {
      secret,
      qrCodeUrl,
      backupCodes,
      isEnabled: false,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await setDoc(doc(db, TOTP_COLLECTION, userId), totpData);
    console.log('TOTP data saved to Firestore');

    return totpData;
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to generate TOTP secret');
  }
};

/**
 * Verify a TOTP code
 */
export const verifyTOTPCode = async (userId: string, code: string): Promise<TOTPVerificationResult> => {
  try {
    console.log('Verifying TOTP code for user:', userId, 'with code:', code);
    
    const userDoc = await getDoc(doc(db, TOTP_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      console.log('TOTP document not found for user:', userId);
      return { valid: false };
    }

    const totpData = userDoc.data() as TOTPSecret;
    console.log('TOTP data found:', { 
      hasSecret: !!totpData.secret, 
      isEnabled: totpData.isEnabled,
      secretLength: totpData.secret?.length,
      backupCodesCount: totpData.backupCodes?.length 
    });

    if (!totpData.isEnabled) {
      console.log('TOTP is not enabled for user:', userId);
      return { valid: false };
    }

    // First try to verify as TOTP code
    console.log('Verifying as TOTP code with secret:', totpData.secret);
    const totpValid = authenticator.verify({
      token: code,
      secret: totpData.secret
    });

    console.log('TOTP verification result:', totpValid);

    if (totpValid) {
      console.log('TOTP code verification successful');
      return { valid: true };
    }

    // If TOTP fails, check if it's a backup code
    console.log('TOTP verification failed, checking backup codes');
    const backupCodeIndex = totpData.backupCodes.findIndex(backupCode => backupCode === code);
    console.log('Backup code index:', backupCodeIndex);
    
    if (backupCodeIndex !== -1) {
      console.log('Backup code found, removing it');
      // Remove the used backup code
      const updatedBackupCodes = totpData.backupCodes.filter((_, index) => index !== backupCodeIndex);
      
      await updateDoc(doc(db, TOTP_COLLECTION, userId), {
        backupCodes: updatedBackupCodes
      });

      console.log('Backup code verification successful, remaining codes:', updatedBackupCodes.length);
      return {
        valid: true,
        backupCodeUsed: true,
        remainingBackupCodes: updatedBackupCodes.length
      };
    }

    console.log('No valid TOTP or backup code found');
    return { valid: false };
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    throw new Error('Failed to verify TOTP code');
  }
};

/**
 * Enable TOTP for a user (after they verify the setup)
 */
export const enableTOTP = async (userId: string, verificationCode: string): Promise<boolean> => {
  try {
    console.log('Enabling TOTP for user:', userId, 'with code:', verificationCode);
    
    const userDoc = await getDoc(doc(db, TOTP_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      console.error('TOTP secret not found for user:', userId);
      throw new Error('TOTP secret not found');
    }

    const totpData = userDoc.data() as TOTPSecret;
    console.log('TOTP data found:', { 
      hasSecret: !!totpData.secret, 
      isEnabled: totpData.isEnabled,
      secretLength: totpData.secret?.length 
    });

    // Verify the code before enabling
    console.log('Verifying TOTP code with secret:', totpData.secret);
    const isValid = authenticator.verify({
      token: verificationCode,
      secret: totpData.secret
    });

    console.log('TOTP verification result:', isValid);

    if (!isValid) {
      console.log('TOTP verification failed');
      return false;
    }

    // Enable TOTP
    console.log('Enabling TOTP in database');
    await updateDoc(doc(db, TOTP_COLLECTION, userId), {
      isEnabled: true
    });

    console.log('TOTP enabled successfully');
    return true;
  } catch (error) {
    console.error('Error enabling TOTP:', error);
    throw new Error('Failed to enable TOTP');
  }
};

/**
 * Disable TOTP for a user
 */
export const disableTOTP = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, TOTP_COLLECTION, userId), {
      isEnabled: false
    });
  } catch (error) {
    console.error('Error disabling TOTP:', error);
    throw new Error('Failed to disable TOTP');
  }
};

/**
 * Get TOTP status for a user
 */
export const getTOTPStatus = async (userId: string): Promise<{ isEnabled: boolean; hasSecret: boolean }> => {
  try {
    const userDoc = await getDoc(doc(db, TOTP_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return { isEnabled: false, hasSecret: false };
    }

    const totpData = userDoc.data() as TOTPSecret;
    return {
      isEnabled: totpData.isEnabled,
      hasSecret: true
    };
  } catch (error) {
    console.error('Error getting TOTP status:', error);
    return { isEnabled: false, hasSecret: false };
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (userId: string): Promise<string[]> => {
  try {
    const newBackupCodes = generateBackupCodes(10);
    
    await updateDoc(doc(db, TOTP_COLLECTION, userId), {
      backupCodes: newBackupCodes
    });

    return newBackupCodes;
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw new Error('Failed to regenerate backup codes');
  }
};

/**
 * Generate backup codes
 */
const generateBackupCodes = (count: number): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  return codes;
};

/**
 * Check if user has TOTP enabled
 */
export const isTOTPEnabled = async (userId: string): Promise<boolean> => {
  try {
    const status = await getTOTPStatus(userId);
    return status.isEnabled;
  } catch (error) {
    console.error('Error checking TOTP status:', error);
    return false;
  }
};
