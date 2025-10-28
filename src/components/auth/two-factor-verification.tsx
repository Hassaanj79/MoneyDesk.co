"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Mail, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { send2FACode, verify2FACode, is2FAEnabled } from "@/services/email-2fa"
import { toast } from "sonner"

interface TwoFactorVerificationProps {
  onSuccess: () => void
  onCancel?: () => void
  email: string
  userId: string
  autoSent?: boolean
}

export function TwoFactorVerification({ onSuccess, onCancel, email, userId, autoSent = false }: TwoFactorVerificationProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await verify2FACode(userId, code)
      
      if (result.success) {
        setSuccess(true)
        toast.success("2FA verification successful!")
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("2FA verification error:", error)
      setError("Failed to verify code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setSendingCode(true)
    setError("")
    setCode("")

    try {
      const result = await send2FACode(userId, email)
      
      if (result.success) {
        toast.success("New verification code sent to your email")
        setTimeLeft(600) // Reset timer
        setCanResend(false)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error sending 2FA code:", error)
      setError("Failed to send verification code. Please try again.")
    } finally {
      setSendingCode(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setCode(numericValue)
    setError("")
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-600">Verification Successful!</CardTitle>
          <CardDescription>
            Your identity has been verified. Redirecting you to the dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          {autoSent 
            ? "We've automatically sent a verification code to your email address"
            : "Please request a verification code to continue"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {autoSent ? "Enter the 6-digit code from your email" : "Click 'Send Code' to receive a verification code"}
          </p>
          {autoSent && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✅ Verification code sent successfully!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="123456"
            className="text-center text-2xl font-mono tracking-widest"
            maxLength={6}
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-4">
          <Button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Code
          </Button>

          <div className="text-sm text-muted-foreground">
            {timeLeft > 0 ? (
              <p>Code expires in {formatTime(timeLeft)}</p>
            ) : (
              <p className="text-red-600">Code has expired</p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleResendCode}
            disabled={sendingCode || !canResend}
            className="w-full"
          >
            {sendingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend Code
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
