

"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProfileForm } from "@/components/settings/profile-form"
import { AppConfigForm } from "@/components/settings/app-config-form"
import { SecuritySettings } from "@/components/settings/security-settings"
import { AIPrivacyToggle } from "@/components/ai/ai-privacy-toggle"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profile" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="app-config" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>App Config</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
          <TabsContent value="app-config">
            <div className="space-y-6">
              <AppConfigForm />
              <AIPrivacyToggle />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
