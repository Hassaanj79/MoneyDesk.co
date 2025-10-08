"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react'
import { verify2FACode } from '@/services/email-2fa'
import { toast } from 'sonner'

export default function Verify2FAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get code and email from URL parameters
    const urlCode = searchParams.get('code')
    const urlEmail = searchParams.get('email')
    
    if (urlCode && urlEmail) {
      setCode(urlCode)
      setEmail(decodeURIComponent(urlEmail))
    }
  }, [searchParams])

  const handleVerify = async () => {
    if (!code.trim() || !email) {
      setError('Please enter a valid verification code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // For this demo, we'll use a mock user ID
      // In a real app, you'd get the user ID from the session
      const result = await verify2FACode('demo-user-id', code.trim())
      
      if (result.success) {
        setIsVerified(true)
        toast.success('2FA verification successful!')
        
        // Redirect to settings after 2 seconds
        setTimeout(() => {
          router.push('/settings?tab=security')
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

  const handleManualEntry = () => {
    // Allow manual code entry
    setCode('')
    setError('')
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Verification Successful!</CardTitle>
            <CardDescription>
              Your 2FA has been enabled successfully. Redirecting to settings...
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
          <CardTitle className="text-2xl">Verify 2FA Code</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="text-center text-sm text-muted-foreground">
              Code sent to: <strong>{email}</strong>
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
                'Verify Code'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleManualEntry}
              className="w-full"
            >
              Enter Code Manually
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder or try again.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
