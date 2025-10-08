"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { verify2FACode, send2FACode } from '@/services/email-2fa'
import { useAuth } from '@/contexts/auth-context'
import { mark2FAVerified } from '@/services/signin-2fa-check'
import { toast } from 'sonner'

export default function SignIn2FAPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  const handleVerify = async () => {
    if (!code.trim() || !user?.uid) {
      setError('Please enter a valid verification code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await verify2FACode(user.uid, code.trim())
      
      if (result.success) {
        setIsVerified(true)
        mark2FAVerified() // Mark 2FA as verified for this session
        toast.success('2FA verification successful! Welcome back!')
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(result.message)
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error)
      setError('Failed to verify code. Please try again.')
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendNewCode = async () => {
    if (!user?.uid || !user?.email) {
      toast.error('User not found')
      return
    }

    setIsSendingCode(true)
    setError('')

    try {
      const result = await send2FACode(user.uid, user.email)
      if (result.success) {
        toast.success('New verification code sent to your email')
        setCode('') // Clear the input
      } else {
        setError(result.message)
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error sending code:', error)
      setError('Failed to send verification code. Please check your email settings.')
      toast.error('Failed to send verification code. Please check your email settings.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>
              2FA verification successful. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Redirecting...</CardTitle>
            <CardDescription>
              Please wait while we redirect you to the login page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email to complete sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <div className="text-center text-sm text-muted-foreground">
              Code sent to: <strong>{user.email}</strong>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerify()
                }
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSendNewCode}
              disabled={isSendingCode}
              className="w-full"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send New Code'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={handleBackToLogin}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder or try sending a new code.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
