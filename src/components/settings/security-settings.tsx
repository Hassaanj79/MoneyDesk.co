"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Shield, Key, Eye, EyeOff, Lock, UserCheck, Check, X, HelpCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DeviceManagement } from "./device-management"
import { toast } from "sonner"

export function SecuritySettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Security Questions state
  const [securityQuestionsOpen, setSecurityQuestionsOpen] = useState(false)
  const [securityQuestionsLoading, setSecurityQuestionsLoading] = useState(false)
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" }
  ])

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    Object.values(checks).forEach(check => {
      if (check) score++
    })

    return { score, checks }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)
  const isPasswordValid = passwordStrength.score >= 4
  const doPasswordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== ""

  // Generate password suggestions
  const generatePasswordSuggestions = () => {
    const suggestions = [
      generateSecurePassword(12),
      generateSecurePassword(14),
      generateSecurePassword(16)
    ]
    return suggestions
  }

  const generateSecurePassword = (length: number) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const [passwordSuggestions] = useState(generatePasswordSuggestions())

  // Predefined security questions
  const predefinedQuestions = [
    "What was the name of your first pet?",
    "What was the name of the street you grew up on?",
    "What was your mother's maiden name?",
    "What was the name of your first school?",
    "What was your childhood nickname?",
    "What was the make of your first car?",
    "What was your favorite food as a child?",
    "What was the name of your first teacher?",
    "What city were you born in?",
    "What was your favorite book as a child?",
    "What was the name of your first employer?",
    "What was your favorite movie as a child?",
    "What was the name of your best friend in high school?",
    "What was your favorite subject in school?",
    "What was the name of your first crush?"
  ]

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSavePassword = async () => {
    if (!user) {
      toast.error("You must be logged in to change your password")
      return
    }

    // Validation
    if (!passwordData.currentPassword) {
      setMessage({ type: "error", text: "Current password is required." })
      return
    }

    if (!passwordData.newPassword) {
      setMessage({ type: "error", text: "New password is required." })
      return
    }

    if (!isPasswordValid) {
      setMessage({ type: "error", text: "New password does not meet security requirements." })
      return
    }

    if (!doPasswordsMatch) {
      setMessage({ type: "error", text: "New password and confirmation do not match." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Import Firebase auth functions
      const { 
        EmailAuthProvider, 
        reauthenticateWithCredential, 
        updatePassword,
        signInWithEmailAndPassword,
        signOut
      } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')
      
      // Store current user email
      const userEmail = user.email!
      
      // Debug logging
      console.log("Attempting password change for user:", userEmail)
      console.log("Current password length:", passwordData.currentPassword.length)
      console.log("New password length:", passwordData.newPassword.length)
      
      // Try re-authentication first
      try {
        const credential = EmailAuthProvider.credential(userEmail, passwordData.currentPassword)
        await reauthenticateWithCredential(user, credential)
        console.log("Re-authentication successful")
      } catch (reauthError: any) {
        console.log("Re-authentication failed, trying sign-in approach:", reauthError.code)
        
        // If re-authentication fails, try signing in with current password
        if (reauthError.code === "auth/invalid-credential" || reauthError.code === "auth/wrong-password") {
          // Sign out current user
          await signOut(auth)
          
          // Sign in with current password
          const userCredential = await signInWithEmailAndPassword(auth, userEmail, passwordData.currentPassword)
          console.log("Sign-in successful, proceeding with password update")
          
          // Update password
          await updatePassword(userCredential.user, passwordData.newPassword)
          
          setMessage({ type: "success", text: "Password updated successfully! You have been re-authenticated." })
          toast.success("Password updated successfully!")
          
          // Clear form
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          })
          
          return // Exit early since we handled the update
        } else {
          throw reauthError // Re-throw if it's a different error
        }
      }
      
      // If re-authentication succeeded, update password normally
      await updatePassword(user, passwordData.newPassword)
      
      setMessage({ type: "success", text: "Password updated successfully!" })
      toast.success("Password updated successfully!")
      
      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
    } catch (error: any) {
      console.error("Password update error:", error)
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setMessage({ type: "error", text: "Current password is incorrect. Please check and try again." })
        toast.error("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        setMessage({ type: "error", text: "New password is too weak." })
        toast.error("New password is too weak")
      } else if (error.code === "auth/requires-recent-login") {
        setMessage({ type: "error", text: "Please log out and log back in, then try again." })
        toast.error("Please log out and log back in, then try again")
      } else if (error.code === "auth/too-many-requests") {
        setMessage({ type: "error", text: "Too many attempts. Please try again later." })
        toast.error("Too many attempts. Please try again later")
      } else if (error.code === "auth/user-not-found") {
        setMessage({ type: "error", text: "User account not found. Please try logging in again." })
        toast.error("User account not found")
      } else {
        setMessage({ type: "error", text: `Failed to update password: ${error.message}` })
        toast.error("Failed to update password")
      }
    } finally {
      setLoading(false)
    }
  }

  // Security Questions handlers
  const handleSecurityQuestionChange = (index: number, field: 'question' | 'answer', value: string) => {
    setSecurityQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ))
  }

  const handleSaveSecurityQuestions = async () => {
    // Validation
    const hasEmptyQuestions = securityQuestions.some(q => !q.question.trim() || !q.answer.trim())
    if (hasEmptyQuestions) {
      toast.error("Please fill in all security questions and answers")
      return
    }

    // Check for duplicate questions
    const questions = securityQuestions.map(q => q.question.trim())
    const uniqueQuestions = new Set(questions)
    if (uniqueQuestions.size !== questions.length) {
      toast.error("Please select different questions for each security question")
      return
    }

    setSecurityQuestionsLoading(true)
    
    try {
      // Simulate API call - in real app, save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("Security questions saved successfully!")
      setSecurityQuestionsOpen(false)
      
      // Reset form
      setSecurityQuestions([
        { question: "", answer: "" },
        { question: "", answer: "" },
        { question: "", answer: "" }
      ])
      
      console.log("Security questions saved:", securityQuestions)
    } catch (error) {
      toast.error("Failed to save security questions")
      console.error("Error saving security questions:", error)
    } finally {
      setSecurityQuestionsLoading(false)
    }
  }

  const handleSaveSettings = () => {
    setLoading(true)
    setMessage(null)
    // Simulate API call for other settings
    setTimeout(() => {
      setMessage({ type: "success", text: "Security settings updated successfully!" })
      console.log("Security settings saved:", {
        twoFactorEnabled,
        deviceManagementEnabled,
        privacySettings,
      })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Manage your account password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  className={passwordData.newPassword ? (isPasswordValid ? "border-green-500" : "border-red-500") : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {passwordStrength.score <= 2 ? 'Weak' :
                       passwordStrength.score <= 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.checks.length ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                      <span className={passwordStrength.checks.length ? "text-green-600" : "text-red-600"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.checks.uppercase ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                      <span className={passwordStrength.checks.uppercase ? "text-green-600" : "text-red-600"}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.checks.lowercase ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                      <span className={passwordStrength.checks.lowercase ? "text-green-600" : "text-red-600"}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.checks.number ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                      <span className={passwordStrength.checks.number ? "text-green-600" : "text-red-600"}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordStrength.checks.special ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                      <span className={passwordStrength.checks.special ? "text-green-600" : "text-red-600"}>
                        One special character
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className={passwordData.confirmPassword ? (doPasswordsMatch ? "border-green-500" : "border-red-500") : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Password Match Indicator */}
              {passwordData.confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {doPasswordsMatch ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Password Suggestions */}
            <div className="space-y-2">
              <Label>Password Suggestions</Label>
              <div className="space-y-2">
                {passwordSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <code className="flex-1 text-xs font-mono bg-white px-2 py-1 rounded border">
                      {suggestion}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPasswordData(prev => ({
                          ...prev,
                          newPassword: suggestion,
                          confirmPassword: ""
                        }))
                        setShowNewPassword(true)
                      }}
                      className="text-xs"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Save Password Button */}
            <div className="flex justify-end pt-4 gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!user || !passwordData.currentPassword) return
                  
                  try {
                    const { signInWithEmailAndPassword } = await import('firebase/auth')
                    const { auth } = await import('@/lib/firebase')
                    
                    // Test current password
                    await signInWithEmailAndPassword(auth, user.email!, passwordData.currentPassword)
                    toast.success("Current password is correct!")
                    console.log("Password verification successful")
                  } catch (error: any) {
                    toast.error(`Password verification failed: ${error.message}`)
                    console.error("Password verification error:", error)
                  }
                }}
                disabled={loading || !passwordData.currentPassword}
                className="text-xs"
              >
                Test Current Password
              </Button>
              <Button
                onClick={handleSavePassword}
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !isPasswordValid || !doPasswordsMatch}
                className="min-w-[120px]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app to generate verification codes
              </p>
            </div>
            <Switch />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Codes</Label>
                <p className="text-sm text-muted-foreground">
                  Generate backup codes for account recovery
                </p>
              </div>
              <Button variant="outline" size="sm">
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control your privacy and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Allow anonymous usage data to improve the app
              </p>
            </div>
            <Switch />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive security and account notifications via email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Additional security measures for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Questions</Label>
              <p className="text-sm text-muted-foreground">
                Set up security questions for account recovery
              </p>
            </div>
            <Dialog open={securityQuestionsOpen} onOpenChange={setSecurityQuestionsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Setup Security Questions
                  </DialogTitle>
                  <DialogDescription>
                    Choose 3 security questions and provide answers. These will be used for account recovery.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {securityQuestions.map((question, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`question-${index}`}>Select a question</Label>
                        <Select
                          value={question.question}
                          onValueChange={(value) => handleSecurityQuestionChange(index, 'question', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a security question..." />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedQuestions.map((q, qIndex) => (
                              <SelectItem key={qIndex} value={q}>
                                {q}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`answer-${index}`}>Your answer</Label>
                        <Input
                          id={`answer-${index}`}
                          type="text"
                          placeholder="Enter your answer..."
                          value={question.answer}
                          onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                        />
                      </div>
                      
                      {index < securityQuestions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSecurityQuestionsOpen(false)}
                    disabled={securityQuestionsLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSecurityQuestions}
                    disabled={securityQuestionsLoading}
                  >
                    {securityQuestionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Security Questions
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Device Management Component */}
      <DeviceManagement />

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Security Settings
        </Button>
      </div>

    </div>
  )
}
