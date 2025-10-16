
"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy,
} from "@dnd-kit/sortable";

import BalanceCard from "@/components/dashboard/balance-card";
import BudgetOverview from "@/components/dashboard/budget-overview";
import IncomeExpenseChart from "@/components/dashboard/income-expense-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import BalanceBreakdown from "@/components/dashboard/balance-breakdown";
import IncomeBreakdown from "@/components/dashboard/income-breakdown";
import ExpenseBreakdown from "@/components/dashboard/expense-breakdown";
import { LoanCards } from "@/components/dashboard/loan-cards";
import { AIInsightsCard } from "@/components/dashboard/ai-insights-card";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { useDateRange } from "@/contexts/date-range-context";
import { SortableItem } from "./sortable-item";
import { useTransactions } from "@/contexts/transaction-context";
import { useAccounts } from "@/contexts/account-context";
import { isWithinInterval, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";
import { getPreviousPeriod, getComparisonDescription } from "@/lib/utils";
import { formatAmount } from "@/utils/format-amount";

export default function DashboardGrid() {
  const { t } = useTranslation();
  const { date } = useDateRange();
  const { transactions, refreshTrigger } = useTransactions();
  const { accounts, refreshTrigger: accountRefreshTrigger } = useAccounts();
  const { formatCurrency, currency } = useCurrency();
  const [showBalanceBreakdown, setShowBalanceBreakdown] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);

  const { totalBalance, totalIncome, totalExpense, incomeChange, expenseChange, comparisonDescription } = useMemo(() => {
    // Helper function to safely convert date to string for parseISO
    const getDateString = (dateValue: any): string => {
      if (typeof dateValue === 'string') {
        return dateValue;
      } else if (dateValue instanceof Date) {
        return dateValue.toISOString();
      } else if (dateValue && typeof dateValue.toDate === 'function') {
        // Firestore timestamp
        return dateValue.toDate().toISOString();
      } else if (dateValue && typeof dateValue.toISOString === 'function') {
        return dateValue.toISOString();
      }
      return new Date().toISOString(); // fallback
    };

    const currentPeriodTransactions = transactions.filter(t => {
      if (!date?.from || !date?.to) return true;
      try {
        const dateString = getDateString(t.date);
        return isWithinInterval(parseISO(dateString), { start: date.from, end: date.to });
      } catch (error) {
        console.warn('Error parsing transaction date:', t.date, error);
        return false;
      }
    });

    // Get the previous period based on the current selected period
    const previousPeriod = getPreviousPeriod(date);
    const previousPeriodTransactions = previousPeriod ? transactions.filter(t => {
      try {
        const dateString = getDateString(t.date);
        return isWithinInterval(parseISO(dateString), { start: previousPeriod.from, end: previousPeriod.to });
      } catch (error) {
        console.warn('Error parsing transaction date for previous period:', t.date, error);
        return false;
      }
    }) : [];

    const currentIncome = currentPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousIncome = previousPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const previousExpense = previousPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatePercentageChange = (current: number, previous: number) => {
        // If both current and previous are 0, show "No change"
        if (current === 0 && previous === 0) {
            return "No change";
        }
        // If previous is 0 but current > 0, show "New this period"
        if (previous === 0 && current > 0) {
            return "New this period";
        }
        // If current is 0 but previous > 0, show "No activity this period"
        if (current === 0 && previous > 0) {
            return "No activity this period";
        }
        // Calculate percentage change for both non-zero values
        const change = ((current - previous) / previous) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }

    const incomeChange = calculatePercentageChange(currentIncome, previousIncome);
    const expenseChange = calculatePercentageChange(currentExpense, previousExpense);
    const comparisonDescription = getComparisonDescription(date);

    // Calculate total balance from all accounts using the stored balance
    // This ensures we use the most up-to-date balance from the database
    const totalBalance = accounts.reduce((acc, account) => {
      // Use the balance from the database, which is kept in sync by the transaction context
      return acc + (account.balance || 0);
    }, 0);

    return {
      totalBalance,
      totalIncome: currentIncome,
      totalExpense: currentExpense,
      incomeChange,
      expenseChange,
      comparisonDescription
    };
  }, [transactions, date, accounts, refreshTrigger, accountRefreshTrigger]);


  const initialItems = [
    {
      id: "balance",
      component: (
        <div 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowBalanceBreakdown(true)}
        >
          <BalanceCard
            title={t('dashboard.totalBalance')}
            amount={formatAmount(totalBalance, currency)}
            icon={Wallet}
          />
        </div>
      ),
      colSpan: "sm:col-span-1 lg:col-span-1",
    },
    {
      id: "income",
      component: (
        <BalanceCard
          title={t('dashboard.totalIncome')}
          amount={formatAmount(totalIncome, currency)}
          icon={ArrowUp}
          change={incomeChange}
          changeDescription={comparisonDescription}
        />
      ),
      colSpan: "sm:col-span-1 lg:col-span-1",
    },
    {
      id: "expense",
      component: (
        <BalanceCard
          title={t('dashboard.totalExpenses')}
          amount={formatAmount(totalExpense, currency)}
          icon={ArrowDown}
          change={expenseChange}
          changeDescription={comparisonDescription}
        />
      ),
      colSpan: "sm:col-span-1 lg:col-span-1",
    },
    {
      id: "chart",
      component: <IncomeExpenseChart />,
      colSpan: "sm:col-span-2 lg:col-span-3",
    },
    {
      id: "budget",
      component: <BudgetOverview />,
      colSpan: "sm:col-span-2 lg:col-span-2",
    },
    {
      id: "recent",
      component: <RecentTransactions />,
      colSpan: "sm:col-span-2 lg:col-span-1",
    },
    {
      id: "ai-insights",
      component: <AIInsightsCard />,
      colSpan: "sm:col-span-2 lg:col-span-2",
    },
    {
      id: "loans",
      component: <LoanCards />,
      colSpan: "sm:col-span-2 lg:col-span-3",
    },
  ];

  const [items, setItems] = useState(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id);
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <DndContext
        id="dashboard-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
      <SortableContext items={items.map(i => i.id)} strategy={rectSwappingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
          {items.map((item) => (
             <SortableItem key={item.id} id={item.id} className={item.colSpan}>
                {item.id === 'balance' ? <div 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowBalanceBreakdown(true)}
                  >
                    <BalanceCard
                      title={t('dashboard.totalBalance')}
                      amount={formatCurrency(totalBalance)}
                      icon={Wallet}
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                  </div> : item.id === 'income' ? <div 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowIncomeBreakdown(true)}
                  >
                    <BalanceCard
                      title={t('dashboard.totalIncome')}
                      amount={formatCurrency(totalIncome)}
                      icon={ArrowDown}
                      change={incomeChange}
                      iconColor="text-green-600 dark:text-green-400"
                    />
                  </div> : item.id === 'expense' ? <div 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowExpenseBreakdown(true)}
                  >
                    <BalanceCard
                      title={t('dashboard.totalExpenses')}
                      amount={formatCurrency(totalExpense)}
                      icon={ArrowUp}
                      change={expenseChange}
                      iconColor="text-red-600 dark:text-red-400"
                      changeColor="text-red-700 dark:text-red-400"
                    />
                  </div> : item.component
                }
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      </DndContext>
      
      <BalanceBreakdown 
        open={showBalanceBreakdown} 
        onOpenChange={setShowBalanceBreakdown} 
      />
      
      <IncomeBreakdown 
        open={showIncomeBreakdown} 
        onOpenChange={setShowIncomeBreakdown} 
      />
      
      <ExpenseBreakdown 
        open={showExpenseBreakdown} 
        onOpenChange={setShowExpenseBreakdown} 
      />
    </>
  );
}
