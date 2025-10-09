
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
  GoogleAuthProvider,
  signInWithPopup,
  getMultiFactorResolver,
  MultiFactorResolver,
} from "firebase/auth";
import { auth } from '@/lib/firebase'; // Assuming firebase is initialized here
import { createActionCodeSettings, createPasswordResetUrl, createEmailVerificationUrl } from '@/lib/auth-config';
import { deleteUserAccount } from '@/services/account-deletion';
import { createEmailOTP, verifyEmailOTP, resendEmailOTP } from '@/services/email-otp';
import { createOrUpdateDeviceSession, generateDeviceId } from '@/services/device-management';
import { firebaseAuthService } from '@/services/firebase-auth';
import { updateUserProfile } from '@/services/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mfaResolver: MultiFactorResolver | null;
  requiresMFA: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<any>;
  signupWithVerification: (email: string, password: string, name: string, phone?: string) => Promise<any>;
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
  signInWithGoogle: () => Promise<any>;
  refreshToken: () => Promise<string | null>;
  ensureValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false); // Start as not initialized

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
        console.log('Setting up auth listener...');
    setLoading(true);
    setAuthInitialized(false);
    
        // Set a shorter timeout to prevent infinite loading
    const timeout = setTimeout(() => {
          console.log('Auth timeout - forcing loading to false');
      setLoading(false);
      setAuthInitialized(true);
        }, 2000); // 2 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
      setAuthInitialized(true);
          
          // Store user email in localStorage for admin access
          if (user?.email) {
            localStorage.setItem('userEmail', user.email);
          } else {
            localStorage.removeItem('userEmail');
          }
          
          console.log('Auth state updated successfully');
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
    console.log('Firebase auth instance:', auth);
    console.log('Auth domain:', auth.config.authDomain);
    console.log('Project ID:', auth.config.projectId);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.email);
      
      // Reset MFA state on successful login
      setMfaResolver(null);
      setRequiresMFA(false);
      
      // Create device session
      try {
        const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
        localStorage.setItem('deviceId', deviceId);
        
        const deviceName = `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`;
        const userAgent = navigator.userAgent;
        
        // Mock IP and location for now - in production, you'd get this from a service
        const ipAddress = '127.0.0.1';
        const location = {
          city: 'Unknown',
          country: 'Unknown',
          region: 'Unknown'
        };
        
        await createOrUpdateDeviceSession(
          result.user.uid,
          deviceId,
          deviceName,
          userAgent,
          ipAddress,
          location,
          false // Default to not remembered
        );
        
        console.log('Device session created successfully');
      } catch (deviceError) {
        console.error('Error creating device session:', deviceError);
        // Don't fail login if device session creation fails
      }
      
      // Login successful
      console.log('Login completed successfully');
      
      return result;
    } catch (error: any) {
      console.error('Login failed with detailed error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name,
        customData: error.customData
      });
      
      // Handle MFA requirement
      if (error.code === 'auth/multi-factor-auth-required') {
        console.log('MFA required, setting up resolver');
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        setRequiresMFA(true);
        throw { ...error, requiresMFA: true, resolver };
      }
      
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, phone?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Store phone number in user profile if provided
    if (phone) {
      try {
        await updateUserProfile(userCredential.user.uid, { phone });
        console.log('Phone number stored in user profile');
      } catch (error) {
        console.error('Error storing phone number:', error);
        // Don't throw error - phone storage is optional
      }
    }
    
    return userCredential;
  };

  const signupWithVerification = async (email: string, password: string, name: string, phone?: string) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Store phone number in user profile if provided
      if (phone) {
        try {
          await updateUserProfile(userCredential.user.uid, { phone });
          console.log('Phone number stored in user profile');
        } catch (error) {
          console.error('Error storing phone number:', error);
          // Don't throw error - phone storage is optional
        }
      }
      
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
      await firebaseAuthService.signOut();
      // Clear user email from localStorage
      localStorage.removeItem('userEmail');
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

  // OAuth Providers
  const googleProvider = new GoogleAuthProvider();
  // Add additional scopes for better profile data
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Store comprehensive user profile data from Google
      try {
        const profileData = {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          provider: 'google' as const,
          // Additional Google-specific data
          emailVerified: user.emailVerified || false,
          lastSignInTime: new Date().toISOString()
        };
        
        await updateUserProfile(user.uid, profileData);
        console.log('Google user profile stored successfully:', {
          name: profileData.name,
          email: profileData.email,
          photoURL: profileData.photoURL
        });
      } catch (error) {
        console.error('Error storing Google user profile:', error);
        // Don't throw error - profile storage is optional
      }
      
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };


  const value = {
    user,
    loading,
    mfaResolver,
    requiresMFA,
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
    signInWithGoogle,
    refreshToken: firebaseAuthService.refreshToken.bind(firebaseAuthService),
    ensureValidToken: firebaseAuthService.ensureValidToken.bind(firebaseAuthService),
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
