"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface CountryContextType {
  country: string;
  setCountry: (country: string) => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountry] = useState<string>('');

  // Load country from localStorage on mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('preferred-country');
    if (savedCountry) {
      setCountry(savedCountry);
    }
  }, []);

  // Save country to localStorage when it changes
  const handleSetCountry = (newCountry: string) => {
    setCountry(newCountry);
    localStorage.setItem('preferred-country', newCountry);
  };

  return (
    <CountryContext.Provider value={{ country, setCountry: handleSetCountry }}>
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
