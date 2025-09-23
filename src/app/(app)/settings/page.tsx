

"use client"

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
import { CancelAccountForm } from "@/components/settings/cancel-account-form"

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profile" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="app-config" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>App Config</span>
            </TabsTrigger>
            <TabsTrigger value="cancel" className="flex items-center justify-center p-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="app-config">
            <AppConfigForm />
          </TabsContent>
          <TabsContent value="cancel">
            <CancelAccountForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
