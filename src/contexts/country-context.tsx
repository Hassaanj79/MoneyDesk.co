"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';
import { getUserSettings, updateUserSettings, initializeUserSettings } from '@/services/user-settings';
import { onSnapshot } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CountryContextType {
  country: string;
  setCountry: (country: string) => void;
  loading: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<string>('US');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const settingsDocRef = doc(db, 'userSettings', user.uid);
      
      const unsubscribe = onSnapshot(settingsDocRef, async (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCountryState(data.country || 'US');
        } else {
          // Initialize with default settings if no settings exist
          const defaultSettings = await initializeUserSettings(user.uid);
          setCountryState(defaultSettings.country);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching country settings:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setCountryState('US');
      setLoading(false);
    }
  }, [user]);

  const handleSetCountry = async (newCountry: string) => {
    if (!user) return;
    
    setCountryState(newCountry);
    try {
      await updateUserSettings(user.uid, { country: newCountry });
    } catch (error) {
      console.error('Error updating country:', error);
    }
  };

  return (
    <CountryContext.Provider value={{ country, setCountry: handleSetCountry, loading }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = React.useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};
