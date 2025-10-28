import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { is2FAEnabled, send2FACode } from '@/services/email-2fa'
import { TwoFactorVerification } from '@/components/auth/two-factor-verification'
import { Loader2 } from 'lucide-react'

interface TwoFAGuardProps {
  children: React.ReactNode
}

/**
 * Debug 2FA Guard Component - Enhanced logging for troubleshooting
 */
export function DebugTwoFAGuard({ children }: TwoFAGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    console.log(`🔍 2FA Debug: ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const check2FA = async () => {
      addDebugLog(`Starting 2FA check - User Email: ${user?.email}, User UID: ${user?.uid}, HasChecked: ${hasChecked}, IsChecking: ${isChecking}`)
      
      // Only check if user is logged in and we haven't checked yet
      if (!user || hasChecked || isChecking) {
        addDebugLog(`Skipping 2FA check - User: ${!!user}, HasChecked: ${hasChecked}, IsChecking: ${isChecking}`)
        return
      }

      // Check if user has already verified 2FA in this session
      const sessionVerified = sessionStorage.getItem('2fa_verified')
      addDebugLog(`Session verified status: ${sessionVerified}`)
      
      if (sessionVerified === 'true') {
        addDebugLog('2FA already verified in this session, skipping')
        setHasChecked(true)
        return
      }

      setIsChecking(true)
      addDebugLog('Starting 2FA enabled check...')
      
      try {
        const isEnabled = await is2FAEnabled(user.uid)
        addDebugLog(`2FA enabled check result: ${isEnabled}`)
        
        if (isEnabled) {
          addDebugLog(`2FA is required for user: ${user.email}`)
          setNeeds2FA(true)
          
          // Automatically send 2FA code when user logs in
          try {
            addDebugLog(`Attempting to send 2FA code to: ${user.email}`)
            const sendResult = await send2FACode(user.uid, user.email || '')
            addDebugLog(`Send result: ${JSON.stringify(sendResult)}`)
            
            if (sendResult.success) {
              addDebugLog('✅ 2FA code sent successfully')
              setCodeSent(true)
            } else {
              addDebugLog(`❌ Failed to send 2FA code: ${sendResult.message}`)
              // Still show the verification screen even if code sending failed
              setCodeSent(false)
            }
          } catch (error) {
            addDebugLog(`❌ Error sending 2FA code: ${error}`)
            setCodeSent(false)
          }
        } else {
          addDebugLog(`2FA not required for user: ${user.email}`)
          // Mark as verified since it's not required
          sessionStorage.setItem('2fa_verified', 'true')
        }
      } catch (error) {
        addDebugLog(`Error checking 2FA requirement: ${error}`)
        // On error, allow access (fail open)
        sessionStorage.setItem('2fa_verified', 'true')
      } finally {
        setIsChecking(false)
        setHasChecked(true)
        addDebugLog('2FA check completed')
      }
    }

    check2FA()
  }, [user, hasChecked])

  const handle2FASuccess = () => {
    addDebugLog('2FA verification successful')
    sessionStorage.setItem('2fa_verified', 'true')
    setNeeds2FA(false)
    setHasChecked(true)
    setCodeSent(false)
  }

  const handle2FACancel = () => {
    addDebugLog('2FA verification cancelled')
    // Clear session and redirect to login
    sessionStorage.removeItem('2fa_verified')
    router.push('/signin')
  }

  // Clear 2FA status when user logs out
  useEffect(() => {
    if (!user) {
      addDebugLog('User logged out, clearing 2FA status')
      sessionStorage.removeItem('2fa_verified')
      setHasChecked(false)
      setIsChecking(false)
      setNeeds2FA(false)
      setCodeSent(false)
      setDebugInfo([])
    }
  }, [user])

  // Show loading while checking 2FA
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking 2FA requirements...</p>
          <div className="mt-4 max-h-40 overflow-y-auto text-xs text-left bg-gray-100 p-2 rounded">
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show 2FA verification if needed
  if (needs2FA && !sessionStorage.getItem('2fa_verified')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <TwoFactorVerification
            onSuccess={handle2FASuccess}
            onCancel={handle2FACancel}
            email={user?.email || ''}
            userId={user?.uid || ''}
            autoSent={codeSent}
          />
          <div className="mt-4 max-h-40 overflow-y-auto text-xs text-left bg-gray-100 p-2 rounded">
            <strong>Debug Log:</strong>
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show children if 2FA is not required or already verified
  return (
    <div>
      {children}
      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs max-w-sm max-h-40 overflow-y-auto">
          <strong>2FA Debug:</strong>
          <div>User Email: {user?.email || 'None'}</div>
          <div>User UID: {user?.uid || 'None'}</div>
          <div>Needs2FA: {needs2FA ? 'Yes' : 'No'}</div>
          <div>CodeSent: {codeSent ? 'Yes' : 'No'}</div>
          <div>SessionVerified: {sessionStorage.getItem('2fa_verified') || 'None'}</div>
        </div>
      )}
    </div>
  )
}
