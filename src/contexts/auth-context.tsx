
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
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
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from '@/lib/firebase'; // Assuming firebase is initialized here
import { createActionCodeSettings, createPasswordResetUrl, createEmailVerificationUrl } from '@/lib/auth-config';
import { deleteUserAccount } from '@/services/account-deletion';
import { createEmailOTP, verifyEmailOTP, resendEmailOTP } from '@/services/email-otp';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [authInitialized, setAuthInitialized] = useState(false); // Start as not initialized

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setLoading(true);
    setAuthInitialized(false);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Auth timeout - setting loading to false');
      setLoading(false);
      setAuthInitialized(true);
    }, 5000); // 5 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
      setAuthInitialized(true);
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
    console.log('Attempting to login with email:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.email);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
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
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Send OTP email immediately
      console.log('Sending OTP email for new user:', email);
      const verificationUrl = createEmailVerificationUrl(email);
      const actionCodeSettings = createActionCodeSettings(verificationUrl);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
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
      const verificationUrl = createEmailVerificationUrl(email);
      const actionCodeSettings = createActionCodeSettings(verificationUrl);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
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
    try {
      await deleteUserAccount(password);
      // User will be automatically logged out after account deletion
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      console.log('Sending password reset email to:', email);
      
      // Create action code settings with custom URL
      const actionCodeSettings = {
        url: `https://moneydesk.co/reset-password`,
        handleCodeInApp: false,
      };
      
      const result = await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('Password reset email sent successfully');
      return result;
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
        return { otp }; // Return OTP for testing purposes
      } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        throw error;
      }
    }
    throw new Error('No user logged in or email already verified');
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      // Verify the OTP
      const isValid = await verifyEmailOTP(email, otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }
      
      // If OTP is valid, mark email as verified
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
      return { otp }; // Return OTP for testing purposes
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      // Verify the OTP
      const isValid = await verifyEmailOTP(email, otp);
      if (!isValid) {
        throw new Error('Invalid OTP');
      }
      
      // If OTP is valid, return success
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const sendPasswordResetWithOTP = async (email: string) => {
    const actionCodeSettings = createActionCodeSettings(
      createPasswordResetUrl(email)
    );
    
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
  };

  const verifyPasswordResetOTP = async (email: string, otp: string, newPassword: string) => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        // Update password
        await result.user.updatePassword(newPassword);
        return result;
      } catch (error) {
        throw error;
      }
    }
    throw new Error('Invalid password reset link');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
