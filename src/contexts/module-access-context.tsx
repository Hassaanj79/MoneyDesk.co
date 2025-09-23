"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ModuleAccess } from '@/types';

interface ModuleAccessContextType {
  moduleAccess: ModuleAccess | null;
  loading: boolean;
  error: string | null;
  hasAccess: (module: keyof ModuleAccess) => boolean;
  refreshAccess: () => Promise<(() => void) | undefined>;
}

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

export const ModuleAccessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccess = async () => {
    if (!user) {
      setModuleAccess(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Listen to real-time changes in user's subscription (where module access is stored)
      const subscriptionRef = doc(db, 'users', user.uid, 'subscription', 'current');
      const unsubscribe = onSnapshot(
        subscriptionRef,
        (doc) => {
          if (doc.exists()) {
            const subscriptionData = doc.data();
            if (subscriptionData.features) {
              setModuleAccess(subscriptionData.features as ModuleAccess);
            } else {
              // Default access for new users
              const defaultAccess: ModuleAccess = {
                dashboard: true,
                transactions: true,
                loans: true,
                reports: false,
                settings: true,
                accounts: true,
                budgets: true,
                categories: true,
              };
              setModuleAccess(defaultAccess);
            }
          } else {
            // No subscription document, use default access
            const defaultAccess: ModuleAccess = {
              dashboard: true,
              transactions: true,
              loans: true,
              reports: false,
              settings: true,
              accounts: true,
              budgets: true,
              categories: true,
            };
            setModuleAccess(defaultAccess);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to module access:', err);
          // Handle permission errors gracefully
          if (err.code === 'permission-denied') {
            console.log('Permission denied for module access, using default access');
            const defaultAccess: ModuleAccess = {
              dashboard: true,
              transactions: true,
              loans: true,
              reports: false,
              settings: true,
              accounts: true,
              budgets: true,
              categories: true,
            };
            setModuleAccess(defaultAccess);
            setError(null);
          } else {
            setError(err.message);
          }
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error('Error fetching module access:', err);
      // Handle permission errors gracefully
      if (err.code === 'permission-denied') {
        console.log('Permission denied for module access, using default access');
        const defaultAccess: ModuleAccess = {
          dashboard: true,
          transactions: true,
          loans: true,
          reports: false,
          settings: true,
          accounts: true,
          budgets: true,
          categories: true,
        };
        setModuleAccess(defaultAccess);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch module access');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      refreshAccess().then((unsub) => {
        unsubscribe = unsub;
      });
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      setModuleAccess(null);
      setLoading(false);
    }
  }, [user]);

  const hasAccess = (module: keyof ModuleAccess): boolean => {
    if (!moduleAccess) return false;
    return moduleAccess[module] === true;
  };

  const value = {
    moduleAccess,
    loading,
    error,
    hasAccess,
    refreshAccess,
  };

  return <ModuleAccessContext.Provider value={value}>{children}</ModuleAccessContext.Provider>;
};

export const useModuleAccess = () => {
  const context = useContext(ModuleAccessContext);
  if (context === undefined) {
    throw new Error('useModuleAccess must be used within a ModuleAccessProvider');
  }
  return context;
};
