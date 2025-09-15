"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencySettings } from "./currency-settings"
import { CategoryManager } from "./category-manager"
import { 
  Settings, 
  DollarSign, 
  Tag
} from "lucide-react"

export function AppConfigForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>
            Manage your application settings, currency, and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="currency" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="currency" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="currency">
              <CurrencySettings />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
