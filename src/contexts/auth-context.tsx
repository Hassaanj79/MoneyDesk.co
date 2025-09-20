
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
} from "firebase/auth";
import { auth } from '@/lib/firebase'; // Assuming firebase is initialized here

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
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

  const logout = () => {
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    sendPasswordReset,
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
