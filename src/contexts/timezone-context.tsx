"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface TimezoneContextType {
  timezone: string
  setTimezone: (timezone: string) => void
  getCurrentTime: () => string
  formatTime: (date: Date) => string
  formatDate: (date: Date) => string
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('UTC')

  useEffect(() => {
    // Load timezone from localStorage on mount
    const savedTimezone = localStorage.getItem('timezone')
    if (savedTimezone) {
      setTimezoneState(savedTimezone)
    } else {
      // Try to detect user's timezone
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        setTimezoneState(detectedTimezone)
      } catch (error) {
        console.warn('Could not detect timezone, using UTC')
        setTimezoneState('UTC')
      }
    }
  }, [])

  const setTimezone = (newTimezone: string) => {
    setTimezoneState(newTimezone)
    localStorage.setItem('timezone', newTimezone)
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
      formatDate
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
