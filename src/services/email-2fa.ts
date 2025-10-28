import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TwoFactorAuthData {
  enabled: boolean;
  lastCodeSent?: Date;
  attempts?: number;
  lockedUntil?: Date;
}

interface TwoFactorCode {
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

/**
 * Generate a 6-digit verification code
 */
const generate2FACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send 2FA code to email using dedicated API route
 */
const send2FACodeToEmail = async (userId: string, email: string, code: string): Promise<void> => {
  try {
    // Call the dedicated 2FA API route
    const response = await fetch('/api/auth/send-2fa-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error sending 2FA email:', error);
      throw new Error(`Failed to send 2FA email: ${error.error || 'Unknown error'}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error('Failed to send 2FA email');
    }

    console.log(`✅ 2FA code sent via SendGrid to ${email}`);
  } catch (error) {
    console.error('Error sending 2FA email via SendGrid:', error);
    // Fallback to console logging
    console.log(`📧 2FA Code for ${email}: ${code}`);
    console.log(`🔐 Please use this code: ${code}`);
    console.log(`⏰ Code expires in 10 minutes`);
  }
};

/**
 * Enable 2FA for a user
 */
export const enable2FA = async (userId: string, email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user2FARef = doc(db, 'user_2fa', userId);
    
    // Check if 2FA is already enabled
    const existingDoc = await getDoc(user2FARef);
    if (existingDoc.exists()) {
      const data = existingDoc.data() as TwoFactorAuthData;
      if (data.enabled) {
        return { success: false, message: '2FA is already enabled for this account' };
      }
    }

    // Enable 2FA
    await setDoc(user2FARef, {
      enabled: true,
      email: email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true, message: '2FA has been enabled successfully' };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw new Error('Failed to enable 2FA');
  }
};

/**
 * Disable 2FA for a user
 */
export const disable2FA = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user2FARef = doc(db, 'user_2fa', userId);
    
    // Check if 2FA is enabled
    const existingDoc = await getDoc(user2FARef);
    if (!existingDoc.exists()) {
      return { success: false, message: '2FA is not enabled for this account' };
    }

    const data = existingDoc.data() as TwoFactorAuthData;
    if (!data.enabled) {
      return { success: false, message: '2FA is not enabled for this account' };
    }

    // Disable 2FA
    await setDoc(user2FARef, {
      enabled: false,
      disabledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Clean up any pending codes
    const codeRef = doc(db, 'user_2fa_codes', userId);
    await deleteDoc(codeRef).catch(() => {
      // Ignore if document doesn't exist
    });

    return { success: true, message: '2FA has been disabled successfully' };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw new Error('Failed to disable 2FA');
  }
};

/**
 * Check if 2FA is enabled for a user
 */
export const is2FAEnabled = async (userId: string): Promise<boolean> => {
  try {
    const user2FARef = doc(db, 'user_2fa', userId);
    const docSnap = await getDoc(user2FARef);
    
    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data() as TwoFactorAuthData;
    return data.enabled === true;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};

/**
 * Send 2FA code to user's email
 */
export const send2FACode = async (userId: string, email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if 2FA is enabled
    const isEnabled = await is2FAEnabled(userId);
    if (!isEnabled) {
      return { success: false, message: '2FA is not enabled for this account' };
    }

    // Call the dedicated API route
    const response = await fetch('/api/auth/send-2fa-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error || 'Failed to send 2FA code' 
      };
    }

    const result = await response.json();
    return { 
      success: result.success, 
      message: result.message || '2FA code sent to your email' 
    };
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return { success: false, message: 'Failed to send 2FA code' };
  }
};

/**
 * Verify 2FA code
 */
export const verify2FACode = async (userId: string, code: string): Promise<{ success: boolean; message: string }> => {
  try {
    const codeRef = doc(db, 'user_2fa_codes', userId);
    const codeDoc = await getDoc(codeRef);
    
    if (!codeDoc.exists()) {
      return { success: false, message: 'No 2FA code found. Please request a new code.' };
    }

    const codeData = codeDoc.data() as TwoFactorCode;
    const now = new Date();

    // Check if code has expired
    if (now > codeData.expiresAt.toDate()) {
      await deleteDoc(codeRef);
      return { success: false, message: '2FA code has expired. Please request a new code.' };
    }

    // Check attempts (max 3 attempts)
    if (codeData.attempts >= 3) {
      await deleteDoc(codeRef);
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    // Verify code
    if (codeData.code !== code) {
      // Increment attempts
      await setDoc(codeRef, {
        attempts: codeData.attempts + 1
      }, { merge: true });
      
      const remainingAttempts = 3 - (codeData.attempts + 1);
      return { 
        success: false, 
        message: `Invalid code. ${remainingAttempts} attempts remaining.` 
      };
    }

    // Code is valid - delete it
    await deleteDoc(codeRef);

    return { success: true, message: '2FA verification successful' };
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    throw new Error('Failed to verify 2FA code');
  }
};

/**
 * Generate backup codes for 2FA
 */
export const generateBackupCodes = async (userId: string): Promise<{ codes: string[]; message: string }> => {
  try {
    const isEnabled = await is2FAEnabled(userId);
    if (!isEnabled) {
      throw new Error('2FA is not enabled for this account');
    }

    // Generate 10 backup codes
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    const backupCodesRef = doc(db, 'user_2fa_backup_codes', userId);
    await setDoc(backupCodesRef, {
      codes: codes,
      createdAt: serverTimestamp(),
      used: []
    });

    return { 
      codes: codes, 
      message: 'Backup codes generated successfully. Store them in a safe place.' 
    };
  } catch (error) {
    console.error('Error generating backup codes:', error);
    throw new Error('Failed to generate backup codes');
  }
};

/**
 * Verify backup code
 */
export const verifyBackupCode = async (userId: string, code: string): Promise<{ success: boolean; message: string }> => {
  try {
    const backupCodesRef = doc(db, 'user_2fa_backup_codes', userId);
    const backupDoc = await getDoc(backupCodesRef);
    
    if (!backupDoc.exists()) {
      return { success: false, message: 'No backup codes found' };
    }

    const backupData = backupDoc.data();
    const codes = backupData.codes || [];
    const used = backupData.used || [];

    // Check if code is valid and not used
    if (!codes.includes(code) || used.includes(code)) {
      return { success: false, message: 'Invalid or already used backup code' };
    }

    // Mark code as used
    await setDoc(backupCodesRef, {
      used: [...used, code]
    }, { merge: true });

    return { success: true, message: 'Backup code verified successfully' };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    throw new Error('Failed to verify backup code');
  }
};
