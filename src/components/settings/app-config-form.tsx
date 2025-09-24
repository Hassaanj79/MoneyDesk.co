"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const [activeSubTab, setActiveSubTab] = useState("currency")

  // Handle URL parameters for direct navigation to subtabs
  useEffect(() => {
    const subtab = searchParams.get('subtab')
    if (subtab && ['currency', 'categories', 'accounts', 'budgets'].includes(subtab)) {
      setActiveSubTab(subtab)
    }
  }, [searchParams])

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
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="currency" className="flex flex-col items-center gap-1 p-2 text-xs">
                <DollarSign className="h-3 w-3" />
                <span className="truncate">Currency</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Tag className="h-3 w-3" />
                <span className="truncate">Categories</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex flex-col items-center gap-1 p-2 text-xs">
                <CreditCard className="h-3 w-3" />
                <span className="truncate">Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="budgets" className="flex flex-col items-center gap-1 p-2 text-xs">
                <Target className="h-3 w-3" />
                <span className="truncate">Budgets</span>
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
