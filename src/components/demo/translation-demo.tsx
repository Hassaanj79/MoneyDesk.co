"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/contexts/language-context';
import { Globe, Loader2 } from 'lucide-react';

export function TranslationDemo() {
  const { t, loading } = useTranslation();
  const languageContext = useLanguage();
  const locale = languageContext?.locale || 'en';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Translations...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Multi-Language Demo
        </CardTitle>
        <CardDescription>
          This demonstrates the translation system working in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('common.dashboard')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('dashboard.welcome')}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              {t('common.transactions')}
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('transactions.title')}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              {t('common.accounts')}
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {t('accounts.title')}
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              {t('common.loans')}
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {t('loans.title')}
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Current Language:</strong> {locale.toUpperCase()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <strong>Translation Status:</strong> {loading ? 'Loading...' : 'Ready'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
