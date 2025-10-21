"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  availableLocales: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Only include languages that have actual translation files
const availableLocales = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' }
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLocale = localStorage.getItem('moneydesk-locale');
    if (savedLocale && availableLocales.find(l => l.code === savedLocale)) {
      setLocale(savedLocale);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      const detectedLocale = availableLocales.find(l => l.code === browserLang);
      if (detectedLocale) {
        setLocale(browserLang);
      }
    }
  }, []);

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('moneydesk-locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale: handleSetLocale, 
      availableLocales 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    return {
      locale: 'en',
      setLocale: () => {},
      availableLocales: availableLocales
    };
  }
  return context;
}