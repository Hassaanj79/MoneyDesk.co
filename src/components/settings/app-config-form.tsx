"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencySettings } from "./currency-settings"
import { CategoryManager } from "./category-manager"
import { AccountsSettings } from "./accounts-settings"
import { BudgetsSettings } from "./budgets-settings"
import {
  Settings,
  DollarSign,
  Tag,
  CreditCard,
  Target
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
                  Manage your application settings, currency, categories, accounts, and budgets
                </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="currency" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="currency" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="budgets" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Budgets
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="currency">
              <CurrencySettings />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>

            <TabsContent value="accounts">
              <AccountsSettings />
            </TabsContent>

            <TabsContent value="budgets">
              <BudgetsSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
