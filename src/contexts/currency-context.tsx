
"use client";

import React, { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useAuth } from './auth-context';
import { getUserSettings, updateUserSettings, initializeUserSettings } from '@/services/user-settings';
import { onSnapshot } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const settingsDocRef = doc(db, 'userSettings', user.uid);
      
      const unsubscribe = onSnapshot(settingsDocRef, async (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCurrencyState(data.currency || 'USD');
        } else {
          // Initialize with default settings if no settings exist
          try {
            const defaultSettings = await initializeUserSettings(user.uid);
            setCurrencyState(defaultSettings.currency);
          } catch (initError) {
            console.log('Could not initialize user settings, using default currency');
            setCurrencyState('USD');
          }
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching currency settings:', error);
        // Don't show permission errors in console for missing documents
        if (error.code !== 'permission-denied') {
          console.error('Currency settings error:', error.message);
        }
        // Set default currency even on error
        setCurrencyState('USD');
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setCurrencyState('USD');
      setLoading(false);
    }
  }, [user]);

  const handleSetCurrency = async (newCurrency: string) => {
    if (!user) return;
    
    setCurrencyState(newCurrency);
    try {
      await updateUserSettings(user.uid, { currency: newCurrency });
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const formatCurrency = useMemo(() => (value: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      ...options
    }).format(value);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrencyContext = () => {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
};
