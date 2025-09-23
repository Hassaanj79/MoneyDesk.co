
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ArrowRightLeft,
  BarChart3,
  Bell,
  LayoutDashboard,
  Search,
  Menu,
  X,
  Loader2,
  History,
  LogOut,
  HandCoins,
  Settings,
  Shield,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Logo } from "@/components/icons/logo";
import { DateRangePicker } from "@/components/date-range-picker";
import { useDateRange } from "@/contexts/date-range-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchTransactions } from "@/ai/flows/search";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { RecapStory } from "@/components/dashboard/recap-story";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
// import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTransactions } from "@/contexts/transaction-context";
import { useLoans } from "@/contexts/loan-context";
import { useAccounts } from "@/contexts/account-context";
import { useBudgets } from "@/contexts/budget-context";
import { useCategories } from "@/contexts/category-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "@/contexts/auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useTranslation } from "@/hooks/use-translation";

const navItems = [
    { href: "/", labelKey: "navigation.dashboard", icon: LayoutDashboard },
    { href: "/transactions", labelKey: "navigation.transactions", icon: ArrowRightLeft },
    { href: "/loans", labelKey: "navigation.loans", icon: HandCoins },
    { href: "/reports", labelKey: "navigation.reports", icon: BarChart3 },
];


export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { date, setDate } = useDateRange();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{
    id: string;
    name: string;
    type: 'transaction' | 'loan' | 'account' | 'budget' | 'category';
    category?: string;
    date?: string;
    amount?: number;
    transactionType?: 'income' | 'expense';
    accountId?: string;
    description?: string;
    status?: string;
    icon?: React.ReactNode;
  }[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchPopoverOpen, setSearchPopoverOpen] = React.useState(false);
  const [recapOpen, setRecapOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = React.useState(false);
  const { transactions } = useTransactions();
  const { loans } = useLoans();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();
  const { categories } = useCategories();
  const { user, logout } = useAuth();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  // Check if user has admin access - only your credentials
  const isAdmin = user?.email && [
    'hassyku786@gmail.com',
  ].includes(user.email.toLowerCase());


  React.useEffect(() => {
    setIsClient(true);
  }, []);


  // Comprehensive search function
  const performComprehensiveSearch = (query: string) => {
    const results: typeof searchResults = [];
    const queryLower = query.toLowerCase();

    // Search transactions
    transactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const account = accounts.find(a => a.id === transaction.accountId);
      
      if (
        transaction.name.toLowerCase().includes(queryLower) ||
        category?.name.toLowerCase().includes(queryLower) ||
        account?.name.toLowerCase().includes(queryLower) ||
        transaction.amount.toString().includes(query) ||
        transaction.type.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: transaction.id,
          name: transaction.name,
          type: 'transaction',
          category: category?.name || 'Unknown',
          date: transaction.date,
          amount: transaction.amount,
          transactionType: transaction.type,
          accountId: transaction.accountId,
          description: `${transaction.type} • ${category?.name || 'Unknown'} • ${account?.name || 'Unknown'}`,
          icon: transaction.type === 'income' ? '💰' : '💸'
        });
      }
    });

    // Search loans
    loans.forEach(loan => {
      if (
        loan.borrowerName.toLowerCase().includes(queryLower) ||
        loan.description?.toLowerCase().includes(queryLower) ||
        loan.amount.toString().includes(query) ||
        loan.status.toLowerCase().includes(queryLower) ||
        loan.type.toLowerCase().includes(queryLower)
      ) {
        const loanTitle = loan.type === 'given' 
          ? `Lent to ${loan.borrowerName}` 
          : `Borrowed from ${loan.borrowerName}`;
        
        results.push({
          id: loan.id,
          name: loanTitle,
          type: 'loan',
          amount: loan.amount,
          description: loan.description || `${loan.status} • ${loan.type} • $${loan.amount}`,
          status: loan.status,
          icon: loan.type === 'given' ? '🤝' : '💳'
        });
      }
    });

    // Search accounts
    accounts.forEach(account => {
      if (
        account.name.toLowerCase().includes(queryLower) ||
        account.type.toLowerCase().includes(queryLower) ||
        account.balance.toString().includes(query)
      ) {
        results.push({
          id: account.id,
          name: account.name,
          type: 'account',
          amount: account.balance,
          description: `${account.type} • Balance: ${account.balance}`,
          icon: '🏦'
        });
      }
    });

    // Search budgets
    budgets.forEach(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      if (
        budget.name.toLowerCase().includes(queryLower) ||
        category?.name.toLowerCase().includes(queryLower) ||
        budget.amount.toString().includes(query) ||
        budget.period.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: budget.id,
          name: budget.name,
          type: 'budget',
          category: category?.name || 'Unknown',
          amount: budget.amount,
          description: `${budget.period} • ${category?.name || 'Unknown'} • ${budget.amount}`,
          icon: '🎯'
        });
      }
    });

    // Search categories
    categories.forEach(category => {
      if (
        category.name.toLowerCase().includes(queryLower) ||
        category.type.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: category.id,
          name: category.name,
          type: 'category',
          description: `${category.type} category`,
          icon: category.type === 'income' ? '📈' : '📉'
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  };

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setSearchPopoverOpen(false);
      return;
    }

    const performSearch = () => {
      setIsSearching(true);
      setSearchPopoverOpen(true);
      
      try {
        const results = performComprehensiveSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Immediate search for better UX
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 150); // Faster debounce for better responsiveness

      return () => clearTimeout(debounceTimer);
    } else {
      // Show popover immediately when typing
      setSearchPopoverOpen(true);
      setSearchResults([]);
    }
  }, [searchQuery, transactions, loans, accounts, budgets, categories]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchPopoverOpen(false);
    // Refocus the input after clearing
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    if (logoutLoading) return; // Prevent multiple clicks
    
    setLogoutLoading(true);
    try {
      console.log('Starting logout process...');
      await logout();
      console.log('Logout completed successfully');
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // You could add a toast notification here if you have one
    } finally {
      setLogoutLoading(false);
    }
  };
  
  const HeaderContent = (
     <header className="sticky top-0 flex h-16 items-center gap-2 border-b bg-background px-4 md:px-6 z-40 overflow-visible">
        {/* Logo - always visible */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base flex-shrink-0"
        >
          <Logo className="h-6 w-6" />
          <span className="hidden sm:inline">MoneyDesk</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:flex-row lg:items-center lg:gap-5 lg:text-sm xl:gap-6 lg:ml-8">
           {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground font-medium",
                pathname === item.href ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo className="h-6 w-6" />
                <span className="">MoneyDesk</span>
              </Link>
               {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "transition-colors hover:text-foreground",
                        pathname === item.href ? "text-foreground" : "text-muted-foreground"
                    )}
                    >
                    {t(item.labelKey)}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center gap-2 md:ml-auto md:gap-2 lg:gap-2 pr-4">
            {/* Date Range Picker - hidden on mobile */}
            <div className="hidden md:block ml-auto">
                <DateRangePicker date={date} onDateChange={setDate} />
            </div>
            <Popover open={searchPopoverOpen} onOpenChange={(open) => {
              setSearchPopoverOpen(open);
              // Keep input focused when popover opens
              if (open) {
                setTimeout(() => searchInputRef.current?.focus(), 0);
              }
            }}>
            <PopoverTrigger asChild>
                <div className="relative flex-1 sm:flex-initial max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input
                       ref={searchInputRef}
                       type="search"
                       placeholder={t('common.search', 'Search transactions, loans, accounts...')}
                       className="w-full rounded-lg bg-background pl-8 sm:w-[200px] lg:w-[250px] xl:w-[300px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       onFocus={() => {
                         if (searchQuery && searchResults.length > 0) {
                           setSearchPopoverOpen(true);
                         }
                       }}
                       onKeyDown={(e) => {
                         // Handle keyboard navigation
                         if (e.key === 'Escape') {
                           setSearchPopoverOpen(false);
                           setSearchQuery('');
                         } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                           e.preventDefault();
                         }
                       }}
                       autoComplete="off"
                     />
                {searchQuery && (
                    <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                    onClick={clearSearch}
                    >
                    <X className="h-4 w-4" />
                    </Button>
                )}
                </div>
            </PopoverTrigger>
                 <PopoverContent 
                   align="start" 
                   className="w-[320px] sm:w-[400px] md:w-[500px] lg:w-[600px] p-0 shadow-lg border-0 bg-white dark:bg-gray-900"
                   onOpenAutoFocus={(e) => e.preventDefault()}
                 >
                   {isSearching ? (
                     <div className="flex items-center justify-center p-6">
                       <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-500" />
                       <span className="text-sm text-muted-foreground">Searching...</span>
                     </div>
                   ) : searchResults.length > 0 ? (
                     <div className="max-h-96 overflow-hidden">
                       <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
                         <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Search Results</h4>
                         <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                           {searchResults.length} found
                         </Badge>
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                         {searchResults.map((result, index) => {
                           const getHref = () => {
                             switch (result.type) {
                               case 'transaction': return '/transactions';
                               case 'loan': return '/loans';
                               case 'account': return '/settings';
                               case 'budget': return '/settings';
                               case 'category': return '/settings';
                               default: return '/';
                             }
                           };
                           
                           return (
                             <div 
                               key={result.id} 
                               onClick={() => {
                                 router.push(getHref());
                                 // Keep search popover open and input focused
                                 setTimeout(() => {
                                   searchInputRef.current?.focus();
                                 }, 100);
                               }}
                               className="cursor-pointer group hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                             >
                               <div className="flex items-center text-sm p-4">
                                 <div className="flex items-center gap-3 flex-1">
                                   <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-800 transition-colors">
                                     <span className="text-base">{result.icon}</span>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2 mb-1">
                                       <p className="font-medium truncate text-gray-900 dark:text-gray-100">{result.name}</p>
                                       <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                         {result.type}
                                       </Badge>
                                     </div>
                                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                                       {result.description}
                                     </p>
                                     {result.date && (
                                       <p className="text-xs text-gray-400 dark:text-gray-500">
                                         {new Date(result.date).toLocaleDateString()}
                                       </p>
                                     )}
                                   </div>
                                 </div>
                                 {result.amount !== undefined && (
                                   <div className={cn(
                                     "ml-2 font-semibold text-sm",
                                     result.transactionType === "income" ? "text-green-600 dark:text-green-400" : 
                                     result.transactionType === "expense" ? "text-red-600 dark:text-red-400" : 
                                     "text-gray-900 dark:text-gray-100"
                                   )}>
                                     {result.transactionType === 'expense' ? '-' : 
                                      result.transactionType === 'income' ? '+' : ''}
                                     ${result.amount.toFixed(2)}
                                   </div>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   ) : (
                     searchQuery && !isSearching ? (
                       <div className="p-8 text-center">
                         <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                           <Search className="h-8 w-8 text-gray-400" />
                         </div>
                         <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                           No results found
                         </h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                           No results found for "{searchQuery}"
                         </p>
                         <p className="text-xs text-gray-400 dark:text-gray-500">
                           Try searching for transactions, loans, accounts, budgets, or categories
                         </p>
                       </div>
                     ) : (
                       <div className="p-6 text-center">
                         <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                           <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                         </div>
                         <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                           Start typing to search
                         </h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400">
                           Search across transactions, loans, accounts, budgets, and categories
                         </p>
                       </div>
                     )
                   )}
                 </PopoverContent>
            </Popover>
            
            {/* Notification Bell */}
            <div className="ml-2">
              <NotificationBell />
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setRecapOpen(true)}>
                    <History className="h-5 w-5" />
                    <span className="sr-only">View recap</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>View recap</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
              {/* <NotificationDropdown /> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('navigation.profile', 'My Account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2" /> {t('navigation.settings')}
                  </DropdownMenuItem>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <Shield className="mr-2" /> Admin Panel
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2" /> {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

        </div>
        <RecapStory open={recapOpen} onOpenChange={setRecapOpen} />
        
        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.confirmLogout', 'Confirm Logout')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('auth.logoutConfirmation', 'Are you sure you want to logout? You will need to sign in again to access your account.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmLogout}
                disabled={logoutLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  t('navigation.logout')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </header>
  );

  if (!isClient) {
    return <>{HeaderContent}</>;
  }

  return <TooltipProvider>{HeaderContent}</TooltipProvider>;
}
