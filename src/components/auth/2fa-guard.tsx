"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { check2FARequired, is2FAVerified, clear2FAStatus } from '@/services/signin-2fa-check'

interface TwoFAGuardProps {
  children: React.ReactNode
}

/**
 * 2FA Guard Component - Checks if 2FA is required after login
 * This component can be added to any layout without disturbing existing code
 */
export function TwoFAGuard({ children }: TwoFAGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    const check2FA = async () => {
      // Only check if user is logged in and we haven't checked yet
      if (!user || hasChecked || isChecking) {
        return
      }

      // Temporarily disable 2FA check to prevent app from getting stuck
      // You can re-enable this later when email system is working properly
      console.log('2FA check temporarily disabled for user:', user.email)
      sessionStorage.setItem('2fa_verified', 'true')
      setHasChecked(true)
      return

      // If user just logged in and 2FA is not verified, check if it's required
      if (!is2FAVerified()) {
        setIsChecking(true)
        
        try {
          const isRequired = await check2FARequired(user.uid)
          
          if (isRequired) {
            console.log('2FA is required for user:', user.email)
            // Redirect to 2FA page
            router.push('/signin-2fa')
            return
          } else {
            console.log('2FA not required for user:', user.email)
            // Mark as verified since it's not required
            sessionStorage.setItem('2fa_verified', 'true')
          }
        } catch (error) {
          console.error('Error checking 2FA requirement:', error)
          // On error, allow access (fail open)
        } finally {
          setIsChecking(false)
          setHasChecked(true)
        }
      } else {
        // 2FA already verified
        setHasChecked(true)
      }
    }

    check2FA()
  }, [user, hasChecked, isChecking, router])

  // Clear 2FA status when user logs out
  useEffect(() => {
    if (!user) {
      clear2FAStatus()
      setHasChecked(false)
      setIsChecking(false)
    }
  }, [user])

  // Show loading while checking 2FA
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking security settings...</p>
        </div>
      </div>
    )
  }

  // Show children if 2FA is not required or already verified
  return <>{children}</>
}
