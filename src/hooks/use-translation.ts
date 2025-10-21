"use client";

import { useLanguage } from '@/contexts/language-context';
import { useState, useEffect } from 'react';

// Simple translation function that loads messages dynamically
export function useTranslation() {
  const languageContext = useLanguage();
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Handle case where context might not be available
  const locale = languageContext?.locale || 'en';

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        // Try to load the specific language file
        const response = await fetch(`/messages/${locale}.json`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          // Fallback to English if language file doesn't exist
          const fallbackResponse = await fetch('/messages/en.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMessages(fallbackData);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to English
        try {
          const fallbackResponse = await fetch('/messages/en.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMessages(fallbackData);
          }
        } catch (fallbackError) {
          console.error('Error loading fallback messages:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [locale]);

  const t = (key: string, params?: Record<string, any>): string => {
    if (!messages) return key;
    
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    if (typeof value === 'string') {
      // Simple parameter replacement
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] || match;
        });
      }
      return value;
    }
    
    return key;
  };

  return { t, loading, locale };
}
