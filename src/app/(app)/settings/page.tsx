

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
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="profile" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="app-config" className="flex items-center justify-center p-3 text-xs sm:text-sm">
              <span>App Config</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="app-config">
            <AppConfigForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
