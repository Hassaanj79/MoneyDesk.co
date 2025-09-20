"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { getUserSettings, updateUserSettings, initializeUserSettings } from '@/services/user-settings'
import { onSnapshot } from 'firebase/firestore'
import { doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface TimezoneContextType {
  timezone: string
  setTimezone: (timezone: string) => void
  getCurrentTime: () => string
  formatTime: (date: Date) => string
  formatDate: (date: Date) => string
  loading: boolean
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('America/New_York')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      setLoading(true)
      const settingsDocRef = doc(db, 'userSettings', user.uid)
      
      const unsubscribe = onSnapshot(settingsDocRef, async (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setTimezoneState(data.timezone || 'America/New_York')
        } else {
          // Initialize with default settings if no settings exist
          const defaultSettings = await initializeUserSettings(user.uid)
          setTimezoneState(defaultSettings.timezone)
        }
        setLoading(false)
      }, (error) => {
        console.error('Error fetching timezone settings:', error)
        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      // Try to detect user's timezone when not logged in
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        setTimezoneState(detectedTimezone)
      } catch (error) {
        console.warn('Could not detect timezone, using America/New_York')
        setTimezoneState('America/New_York')
      }
      setLoading(false)
    }
  }, [user])

  const setTimezone = async (newTimezone: string) => {
    if (!user) return
    
    setTimezoneState(newTimezone)
    try {
      await updateUserSettings(user.uid, { timezone: newTimezone })
    } catch (error) {
      console.error('Error updating timezone:', error)
    }
  }

  const getCurrentTime = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return new Date().toLocaleString()
    }
  }

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return date.toLocaleString()
    }
  }

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return date.toLocaleDateString()
    }
  }

  return (
    <TimezoneContext.Provider value={{
      timezone,
      setTimezone,
      getCurrentTime,
      formatTime,
      formatDate,
      loading
    }}>
      {children}
    </TimezoneContext.Provider>
  )
}

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider')
  }
  return context
}
