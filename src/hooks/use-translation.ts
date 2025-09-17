"use client"

import { useLanguage } from '@/contexts/language-context'
import { useState, useEffect } from 'react'

// Simple translation hook that loads translations dynamically
export function useTranslation() {
  const { language } = useLanguage()
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/messages/${language}.json`)
        if (response.ok) {
          const data = await response.json()
          setTranslations(data)
        } else {
          // Fallback to English if language file doesn't exist
          const fallbackResponse = await fetch('/messages/en.json')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            setTranslations(fallbackData)
          }
        }
      } catch (error) {
        console.error('Error loading translations:', error)
        // Fallback to English
        try {
          const fallbackResponse = await fetch('/messages/en.json')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            setTranslations(fallbackData)
          }
        } catch (fallbackError) {
          console.error('Error loading fallback translations:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    loadTranslations()
  }, [language])

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }

  return { t, loading, language }
}
