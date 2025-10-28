"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { is2FAEnabled } from "@/services/email-2fa"
import { TwoFactorVerification } from "./two-factor-verification"
import { Loader2 } from "lucide-react"

interface TwoFactorGuardProps {
  children: React.ReactNode
}

export function TwoFactorGuard({ children }: TwoFactorGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking2FA, setChecking2FA] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const check2FAStatus = async () => {
      if (!user || loading) return

      // Check if user has already verified 2FA in this session
      const sessionVerified = sessionStorage.getItem('2fa_verified')
      if (sessionVerified === 'true') {
        setIsVerified(true)
        return
      }

      setChecking2FA(true)

      try {
        const isEnabled = await is2FAEnabled(user.uid)
        
        if (isEnabled) {
          setNeeds2FA(true)
        } else {
          setIsVerified(true)
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error)
        // If there's an error checking 2FA, allow access
        setIsVerified(true)
      } finally {
        setChecking2FA(false)
      }
    }

    check2FAStatus()
  }, [user, loading])

  const handle2FASuccess = () => {
    sessionStorage.setItem('2fa_verified', 'true')
    setIsVerified(true)
    setNeeds2FA(false)
  }

  const handle2FACancel = () => {
    // Clear session and redirect to login
    sessionStorage.removeItem('2fa_verified')
    router.push('/signin')
  }

  // Show loading while checking auth or 2FA status
  if (loading || checking2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your identity...</p>
        </div>
      </div>
    )
  }

  // Show 2FA verification if needed
  if (needs2FA && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <TwoFactorVerification
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
          email={user?.email || ''}
          userId={user?.uid || ''}
        />
      </div>
    )
  }

  // Show children if 2FA is not required or already verified
  return <>{children}</>
}
