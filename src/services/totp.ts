import speakeasy from 'speakeasy';
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
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `MoneyDesk (${userEmail})`,
      issuer: 'MoneyDesk',
      length: 32
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    const totpData: TOTPSecret = {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
      isEnabled: false,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await setDoc(doc(db, TOTP_COLLECTION, userId), totpData);

    return totpData;
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw new Error('Failed to generate TOTP secret');
  }
};

/**
 * Verify a TOTP code
 */
export const verifyTOTPCode = async (userId: string, code: string): Promise<TOTPVerificationResult> => {
  try {
    const userDoc = await getDoc(doc(db, TOTP_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return { valid: false };
    }

    const totpData = userDoc.data() as TOTPSecret;

    if (!totpData.isEnabled) {
      return { valid: false };
    }

    // First try to verify as TOTP code
    const totpValid = speakeasy.totp.verify({
      secret: totpData.secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time windows (60 seconds) of tolerance
    });

    if (totpValid) {
      return { valid: true };
    }

    // If TOTP fails, check if it's a backup code
    const backupCodeIndex = totpData.backupCodes.findIndex(backupCode => backupCode === code);
    
    if (backupCodeIndex !== -1) {
      // Remove the used backup code
      const updatedBackupCodes = totpData.backupCodes.filter((_, index) => index !== backupCodeIndex);
      
      await updateDoc(doc(db, TOTP_COLLECTION, userId), {
        backupCodes: updatedBackupCodes
      });

      return {
        valid: true,
        backupCodeUsed: true,
        remainingBackupCodes: updatedBackupCodes.length
      };
    }

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
    const userDoc = await getDoc(doc(db, TOTP_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      throw new Error('TOTP secret not found');
    }

    const totpData = userDoc.data() as TOTPSecret;

    // Verify the code before enabling
    const isValid = speakeasy.totp.verify({
      secret: totpData.secret,
      encoding: 'base32',
      token: verificationCode,
      window: 2
    });

    if (!isValid) {
      return false;
    }

    // Enable TOTP
    await updateDoc(doc(db, TOTP_COLLECTION, userId), {
      isEnabled: true
    });

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
