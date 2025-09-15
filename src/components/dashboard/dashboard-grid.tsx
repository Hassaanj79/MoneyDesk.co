
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
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { useDateRange } from "@/contexts/date-range-context";
import { SortableItem } from "./sortable-item";
import { useTransactions } from "@/contexts/transaction-context";
import { isWithinInterval, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";

export default function DashboardGrid() {
  const { date } = useDateRange();
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const { totalBalance, totalIncome, totalExpense, incomeChange, expenseChange } = useMemo(() => {
    const currentPeriodTransactions = transactions.filter(t => 
      date?.from && date?.to ? isWithinInterval(parseISO(t.date), { start: date.from, end: date.to }) : true
    );

    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
    const lastMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: lastMonthEnd })
    );

    const currentIncome = currentPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const lastMonthExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const change = ((current - previous) / previous) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }

    const incomeChange = calculatePercentageChange(currentIncome, lastMonthIncome);
    const expenseChange = calculatePercentageChange(currentExpense, lastMonthExpense);

    const totalBalance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

    return {
      totalBalance,
      totalIncome: currentIncome,
      totalExpense: currentExpense,
      incomeChange,
      expenseChange
    };
  }, [transactions, date]);


  const initialItems = [
    {
      id: "balance",
      component: (
        <BalanceCard
          title="Total Balance"
          amount={formatCurrency(totalBalance)}
          icon={Wallet}
        />
      ),
      colSpan: "sm:col-span-1 md:col-span-1 lg:col-span-1",
    },
    {
      id: "income",
      component: (
        <BalanceCard
          title="Income"
          amount={formatCurrency(totalIncome)}
          icon={ArrowUp}
          change={incomeChange}
        />
      ),
      colSpan: "sm:col-span-1 md:col-span-1 lg:col-span-1",
    },
    {
      id: "expense",
      component: (
        <BalanceCard
          title="Expense"
          amount={formatCurrency(totalExpense)}
          icon={ArrowDown}
          change={expenseChange}
        />
      ),
      colSpan: "sm:col-span-2 md:col-span-1 lg:col-span-1",
    },
    {
      id: "chart",
      component: <IncomeExpenseChart />,
      colSpan: "sm:col-span-2 md:col-span-3 lg:col-span-3",
    },
    {
      id: "budget",
      component: <BudgetOverview />,
      colSpan: "sm:col-span-2 md:col-span-2 lg:col-span-2",
    },
    {
      id: "recent",
      component: <RecentTransactions />,
      colSpan: "sm:col-span-2 md:col-span-1 lg:col-span-1",
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
    <DndContext
      id="dashboard-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={rectSwappingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item) => (
             <SortableItem key={item.id} id={item.id} className={item.colSpan}>
                {item.id === 'balance' ? <BalanceCard
                    title="Total Balance"
                    amount={formatCurrency(totalBalance)}
                    icon={Wallet}
                    iconColor="text-blue-600 dark:text-blue-400"
                    /> : item.id === 'income' ? <BalanceCard
                    title="Income"
                    amount={formatCurrency(totalIncome)}
                    icon={ArrowDown}
                    change={incomeChange}
                    iconColor="text-green-600 dark:text-green-400"
                    /> : item.id === 'expense' ? <BalanceCard
                    title="Expense"
                    amount={formatCurrency(totalExpense)}
                    icon={ArrowUp}
                    change={expenseChange}
                    iconColor="text-red-600 dark:text-red-400"
                    changeColor="text-red-700 dark:text-red-400"
                    /> : item.component
                }
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
