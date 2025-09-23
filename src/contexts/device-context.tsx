"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  DeviceSession, 
  getUserActiveSessions, 
  subscribeToUserSessions,
  toggleRememberMe,
  endSession,
  endAllSessions,
  getSessionCount
} from '@/services/device-management';

interface DeviceContextType {
  sessions: DeviceSession[];
  sessionCount: number;
  loading: boolean;
  error: string | null;
  toggleRememberMeForSession: (sessionId: string, isRemembered: boolean) => Promise<void>;
  endSessionById: (sessionId: string) => Promise<void>;
  endAllUserSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial sessions
  const loadSessions = async () => {
    if (!user) {
      setSessions([]);
      setSessionCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const activeSessions = await getUserActiveSessions(user.uid);
      const count = await getSessionCount(user.uid);
      
      setSessions(activeSessions);
      setSessionCount(count);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setSessionCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load initial data
    loadSessions();

    // Set up real-time listener
    const unsubscribe = subscribeToUserSessions(user.uid, (realTimeSessions) => {
      setSessions(realTimeSessions);
      setSessionCount(realTimeSessions.length);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Toggle remember me for a session
  const toggleRememberMeForSession = async (sessionId: string, isRemembered: boolean) => {
    try {
      setError(null);
      await toggleRememberMe(sessionId, isRemembered);
      
      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, isRemembered }
          : session
      ));
    } catch (err: any) {
      console.error('Error toggling remember me:', err);
      setError(err.message || 'Failed to toggle remember me');
      throw err;
    }
  };

  // End a specific session
  const endSessionById = async (sessionId: string) => {
    try {
      setError(null);
      await endSession(sessionId);
      
      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setSessionCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error ending session:', err);
      setError(err.message || 'Failed to end session');
      throw err;
    }
  };

  // End all sessions
  const endAllUserSessions = async () => {
    if (!user) return;
    
    try {
      setError(null);
      await endAllSessions(user.uid);
      
      // Update local state
      setSessions([]);
      setSessionCount(0);
    } catch (err: any) {
      console.error('Error ending all sessions:', err);
      setError(err.message || 'Failed to end all sessions');
      throw err;
    }
  };

  // Refresh sessions manually
  const refreshSessions = async () => {
    await loadSessions();
  };

  const value = {
    sessions,
    sessionCount,
    loading,
    error,
    toggleRememberMeForSession,
    endSessionById,
    endAllUserSessions,
    refreshSessions
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
