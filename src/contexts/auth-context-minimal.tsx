"use client";

import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from '@/lib/firebase';
import { createActionCodeSettings, createPasswordResetUrl, createEmailVerificationUrl } from '@/lib/auth-config';
import { deleteUserAccount } from '@/services/account-deletion';
import { createEmailOTP, verifyEmailOTP, resendEmailOTP } from '@/services/email-otp';
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  signupWithVerification: (email: string, password: string, name: string) => Promise<any>;
  resendSignupOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<any>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  sendOTPEmail: (email: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  sendPasswordResetWithOTP: (email: string) => Promise<void>;
  verifyPasswordResetOTP: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderMinimal = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setLoading(true);
    setAuthInitialized(false);
    
    const timeout = setTimeout(() => {
      console.log('Auth timeout - setting loading to false');
      setLoading(false);
      setAuthInitialized(true);
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
      setAuthInitialized(true);
      
      // User state updated
      console.log('User state updated');
    }, (error) => {
      console.error('Firebase auth error:', error);
      clearTimeout(timeout);
      setLoading(false);
      setAuthInitialized(true);
    });
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('=== LOGIN START ===');
    console.log('Attempting to login with email:', email);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.email);
      console.log('=== LOGIN END ===');
      return result;
    } catch (error: any) {
      console.error('Login failed with detailed error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name,
        customData: error.customData
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential;
  };

  const signupWithVerification = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      console.log('Sending OTP email for new user:', email);
      await createEmailOTP(email);
      console.log('OTP email sent successfully');
      
      return userCredential;
    } catch (error) {
      console.error('Error in signupWithVerification:', error);
      throw error;
    }
  };

  const resendSignupOTP = async (email: string) => {
    try {
      console.log('Resending OTP email for:', email);
      await resendEmailOTP(email);
      console.log('OTP email resent successfully');
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      await signOut(auth);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user) {
      throw new Error("No user logged in.");
    }
    try {
      await deleteUserAccount(user, password);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      console.log('Sending password reset email to:', email);
      const actionCodeSettings = {
        url: `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/reset-password`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('Password reset email sent successfully.');
    } catch (error) {
      console.error('Error in sendPasswordReset:', error);
      throw error;
    }
  }

  const sendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      try {
        console.log('Sending OTP for email verification:', user.email);
        const otp = await createEmailOTP(user.email);
        console.log('Email verification OTP sent successfully');
        return { otp };
      } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        throw error;
      }
    }
    throw new Error('No user logged in or email already verified');
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const isValid = await verifyEmailOTP(email, otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }
      
      if (user && user.email === email) {
        await updateProfile(user, { emailVerified: true });
      }
    } catch (error) {
      throw error;
    }
  };

  const sendOTPEmail = async (email: string) => {
    try {
      console.log('Sending OTP email for:', email);
      const otp = await createEmailOTP(email);
      console.log('OTP email sent successfully');
      return { otp };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const isValid = await verifyEmailOTP(email, otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const sendPasswordResetWithOTP = async (email: string) => {
    try {
      console.log('Sending password reset OTP to:', email);
      const otp = await createEmailOTP(email);
      console.log('Password reset OTP sent successfully.');
      return { otp };
    } catch (error) {
      console.error('Error in sendPasswordResetWithOTP:', error);
      throw error;
    }
  };

  const verifyPasswordResetOTP = async (email: string, otp: string, newPassword: string) => {
    try {
      const isValid = await verifyEmailOTP(email, otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }
      
      if (auth.currentUser && auth.currentUser.email === email) {
        await updatePassword(auth.currentUser, newPassword);
      } else {
        throw new Error('User not authenticated or email mismatch for password reset.');
      }
    } catch (error) {
      console.error('Error in verifyPasswordResetOTP:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    signupWithVerification,
    resendSignupOTP,
    logout,
    deleteAccount,
    sendPasswordReset,
    sendVerificationEmail,
    verifyEmail,
    sendOTPEmail,
    verifyOTP,
    sendPasswordResetWithOTP,
    verifyPasswordResetOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
