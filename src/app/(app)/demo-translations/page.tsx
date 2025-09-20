"use client"

import { useTranslation } from '@/hooks/use-translation'
import { useLanguage } from '@/contexts/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, RefreshCw } from 'lucide-react'

export default function DemoTranslationsPage() {
  const { t, loading } = useTranslation()
  const { language, setLanguage, availableLanguages } = useLanguage()

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading translations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.language', 'Language Demo')}
          </CardTitle>
          <CardDescription>
            {t('settings.selectLanguage', 'Select your preferred language to see the interface change')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {availableLanguages.slice(0, 10).map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  {lang.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('navigation.dashboard', 'Dashboard')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('dashboard.totalBalance', 'Total Balance')}:</strong> $10,000</p>
            <p><strong>{t('dashboard.totalIncome', 'Total Income')}:</strong> $5,000</p>
            <p><strong>{t('dashboard.totalExpenses', 'Total Expenses')}:</strong> $3,000</p>
            <p><strong>{t('dashboard.netSavings', 'Net Savings')}:</strong> $2,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('transactions.title', 'Transactions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('transactions.income', 'Income')}:</strong> $2,500</p>
            <p><strong>{t('transactions.expense', 'Expense')}:</strong> $1,200</p>
            <p><strong>{t('transactions.category', 'Category')}:</strong> {t('categories.food', 'Food')}</p>
            <p><strong>{t('transactions.account', 'Account')}:</strong> {t('accounts.bank', 'Bank')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('loans.title', 'Loans')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('loans.loansGiven', 'Loans Given')}:</strong> $5,000</p>
            <p><strong>{t('loans.loansTaken', 'Loans Taken')}:</strong> $2,000</p>
            <p><strong>{t('loans.activeLoans', 'Active Loans')}:</strong> 3</p>
            <p><strong>{t('loans.netPosition', 'Net Position')}:</strong> $3,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.title', 'Reports')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('reports.monthlyTrends', 'Monthly Trends')}:</strong> {t('common.loading', 'Loading...')}</p>
            <p><strong>{t('reports.spendingByCategory', 'Spending by Category')}:</strong> {t('common.loading', 'Loading...')}</p>
            <p><strong>{t('reports.savingTrends', 'Saving Trends')}:</strong> {t('common.loading', 'Loading...')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('accounts.title', 'Accounts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('accounts.bank', 'Bank')}:</strong> $8,000</p>
            <p><strong>{t('accounts.cash', 'Cash')}:</strong> $500</p>
            <p><strong>{t('accounts.savings', 'Savings')}:</strong> $1,500</p>
            <p><strong>{t('accounts.totalBalance', 'Total Balance')}:</strong> $10,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('budgets.title', 'Budgets')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t('budgets.budgetName', 'Budget Name')}:</strong> {t('budgets.monthly', 'Monthly')}</p>
            <p><strong>{t('budgets.budgetAmount', 'Budget Amount')}:</strong> $3,000</p>
            <p><strong>{t('budgets.spent', 'Spent')}:</strong> $2,500</p>
            <p><strong>{t('budgets.remaining', 'Remaining')}:</strong> $500</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.info', 'Information')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>{t('settings.language', 'Current Language')}:</strong> {language.toUpperCase()}</p>
            <p><strong>{t('common.loading', 'Translation Status')}:</strong> {loading ? t('common.loading', 'Loading...') : t('common.success', 'Loaded')}</p>
            <p><strong>{t('settings.selectLanguage', 'Available Languages')}:</strong> {availableLanguages.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
