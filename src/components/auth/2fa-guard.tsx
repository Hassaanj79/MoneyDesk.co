"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { is2FAEnabled, send2FACode } from '@/services/email-2fa'
import { TwoFactorVerification } from './two-factor-verification'
import { Loader2 } from 'lucide-react'

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
  const [needs2FA, setNeeds2FA] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  useEffect(() => {
    const check2FA = async () => {
      // Only check if user is logged in and we haven't checked yet
      if (!user || hasChecked || isChecking) {
        return
      }

      // Check if user has already verified 2FA in this session
      const sessionVerified = sessionStorage.getItem('2fa_verified')
      if (sessionVerified === 'true') {
        setHasChecked(true)
        return
      }

      setIsChecking(true)
      
      try {
        const isEnabled = await is2FAEnabled(user.uid)
        
        if (isEnabled) {
          console.log('2FA is required for user:', user.email)
          setNeeds2FA(true)
          
          // Automatically send 2FA code when user logs in
          try {
            console.log('Sending 2FA code to:', user.email)
            const sendResult = await send2FACode(user.uid, user.email || '')
            if (sendResult.success) {
              console.log('✅ 2FA code sent successfully')
              setCodeSent(true)
            } else {
              console.error('❌ Failed to send 2FA code:', sendResult.message)
              // Still show the verification screen even if code sending failed
              // The user can manually request a new code
              setCodeSent(false)
            }
          } catch (error) {
            console.error('❌ Error sending 2FA code:', error)
            // Still show the verification screen even if code sending failed
            setCodeSent(false)
          }
        } else {
          console.log('2FA not required for user:', user.email)
          // Mark as verified since it's not required
          sessionStorage.setItem('2fa_verified', 'true')
        }
      } catch (error) {
        console.error('Error checking 2FA requirement:', error)
        // On error, allow access (fail open)
        sessionStorage.setItem('2fa_verified', 'true')
      } finally {
        setIsChecking(false)
        setHasChecked(true)
      }
    }

    check2FA()
  }, [user, hasChecked, isChecking])

  const handle2FASuccess = () => {
    sessionStorage.setItem('2fa_verified', 'true')
    setNeeds2FA(false)
    setHasChecked(true)
    setCodeSent(false)
  }

  const handle2FACancel = () => {
    // Clear session and redirect to login
    sessionStorage.removeItem('2fa_verified')
    router.push('/signin')
  }

  // Clear 2FA status when user logs out
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem('2fa_verified')
      setHasChecked(false)
      setIsChecking(false)
      setNeeds2FA(false)
      setCodeSent(false)
    }
  }, [user])

  // Show loading while checking 2FA
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Checking security settings...</p>
        </div>
      </div>
    )
  }

  // Show 2FA verification if needed
  if (needs2FA && !sessionStorage.getItem('2fa_verified')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <TwoFactorVerification
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
          email={user?.email || ''}
          userId={user?.uid || ''}
          autoSent={codeSent}
        />
      </div>
    )
  }

  // Show children if 2FA is not required or already verified
  return <>{children}</>
}
