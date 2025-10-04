import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { DateRangeProvider } from '@/contexts/date-range-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { CountryProvider } from '@/contexts/country-context';
import { CategoryProvider } from '@/contexts/category-context';
import { AccountProvider } from '@/contexts/account-context';
import { TransactionProvider } from '@/contexts/transaction-context';
import { BudgetProvider } from '@/contexts/budget-context';
import { LoanProvider } from '@/contexts/loan-context';
import { LoanInstallmentProvider } from '@/contexts/loan-installment-context';
import { TimezoneProvider } from '@/contexts/timezone-context';
import { ModuleAccessProvider } from '@/contexts/module-access-context';
import { AdminProvider } from '@/contexts/admin-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { DeviceProvider } from '@/contexts/device-context';
import { Analytics } from '@vercel/analytics/next';
import ErrorBoundary from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'MoneyDesk',
  description: 'Personal Expense & Income Management SaaS',
  icons: {
    icon: [
      { url: '/favicon.svg?v=4', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=4', sizes: '16x16 32x32' },
    ],
    apple: '/apple-touch-icon.png?v=4',
    shortcut: '/favicon.ico?v=4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico?v=4" sizes="16x16 32x32" />
        <link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <meta name="msapplication-TileImage" content="/favicon.ico?v=4" />
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className="font-body antialiased">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              <AuthProvider>
                <ModuleAccessProvider>
                  <AdminProvider>
                    <CurrencyProvider>
                      <CountryProvider>
                        <CategoryProvider>
                          <AccountProvider>
                            <TransactionProvider>
                              <BudgetProvider>
                                <LoanProvider>
                                  <LoanInstallmentProvider>
                                    <TimezoneProvider>
                                      <DateRangeProvider>
                                        <NotificationProvider>
                                          <DeviceProvider>
                                            {children}
                                            <Toaster />
                                            <Analytics />
                                          </DeviceProvider>
                                        </NotificationProvider>
                                      </DateRangeProvider>
                                    </TimezoneProvider>
                                  </LoanInstallmentProvider>
                                </LoanProvider>
                              </BudgetProvider>
                            </TransactionProvider>
                          </AccountProvider>
                        </CategoryProvider>
                      </CountryProvider>
                    </CurrencyProvider>
                  </AdminProvider>
                </ModuleAccessProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
