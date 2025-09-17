import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { DateRangeProvider } from '@/contexts/date-range-context';
import { ThemeProvider } from '@/components/theme-provider';
import { TransactionProvider } from '@/contexts/transaction-context';
// import { NotificationProvider } from '@/contexts/notification-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { CountryProvider } from '@/contexts/country-context';
import { AuthProvider } from '@/contexts/auth-context';
import { AccountProvider } from '@/contexts/account-context';
import { BudgetProvider } from '@/contexts/budget-context';
import { CategoryProvider } from '@/contexts/category-context';
import { LoanProvider } from '@/contexts/loan-context';
import { LoanInstallmentProvider } from '@/contexts/loan-installment-context';
import { TimezoneProvider } from '@/contexts/timezone-context';
import { LanguageProvider } from '@/contexts/language-context';
import { RecurringNotifications } from '@/components/recurring-notifications';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'MoneyDesk',
  description: 'Personal Expense & Income Management SaaS',
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png?v=2',
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
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <CurrencyProvider>
                <CountryProvider>
                  <CategoryProvider>
                    <AccountProvider>
                      <TransactionProvider>
                        <DateRangeProvider>
                          <BudgetProvider>
                            <LoanProvider>
                              <LoanInstallmentProvider>
                                <TimezoneProvider>
                                  <RecurringNotifications />
                                  {children}
                                  <Toaster />
                                  <Analytics />
                                </TimezoneProvider>
                              </LoanInstallmentProvider>
                            </LoanProvider>
                          </BudgetProvider>
                        </DateRangeProvider>
                      </TransactionProvider>
                    </AccountProvider>
                  </CategoryProvider>
                </CountryProvider>
              </CurrencyProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
