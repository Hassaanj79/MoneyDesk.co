"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Settings, 
  CreditCard, 
  Target, 
  DollarSign, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { Logo } from "@/components/icons/logo"

export function WelcomePopup() {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome popup and if they're a new user
    if (typeof window !== 'undefined' && user) {
      const seenWelcome = localStorage.getItem('hasSeenWelcome')
      const isNewUser = checkIfNewUser(user)
      
      console.log('Welcome popup check - seenWelcome:', seenWelcome, 'isNewUser:', isNewUser, 'user:', user.displayName)
      
      // Only show popup for new users who haven't seen it
      if (!seenWelcome && isNewUser) {
        console.log('Showing welcome popup for new user:', user.displayName)
        setIsOpen(true)
      }
    }
  }, [user])

  const checkIfNewUser = (user: any) => {
    if (!user.metadata?.creationTime) {
      return false
    }
    
    // Check if user was created within the last 5 minutes (300 seconds)
    const creationTime = new Date(user.metadata.creationTime).getTime()
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    return creationTime > fiveMinutesAgo
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
    setHasSeenWelcome(true)
  }

  const handleGoToSettings = () => {
    handleClose()
    router.push('/settings')
  }

  const handleDismiss = () => {
    handleClose()
  }

  if (hasSeenWelcome || !user || !checkIfNewUser(user)) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Logo className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                  New
                </Badge>
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to MoneyDesk! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Hi {user?.displayName || 'there'}! Let's get your financial journey started.
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Quick Setup Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Set up these essentials to make the most of MoneyDesk
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Set Your Currency</p>
                    <p className="text-xs text-muted-foreground">Choose your preferred currency</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Add Your Accounts</p>
                    <p className="text-xs text-muted-foreground">Connect your bank accounts</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Create Budgets</p>
                    <p className="text-xs text-muted-foreground">Set spending limits and goals</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>All setup can be done in Settings</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGoToSettings}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDismiss}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
