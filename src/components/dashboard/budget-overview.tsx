

"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDateRange } from '@/contexts/date-range-context';
import { isWithinInterval, parseISO } from 'date-fns';
import { useCurrency } from '@/hooks/use-currency';
import { useTransactions } from '@/contexts/transaction-context';
import { useBudgets } from '@/contexts/budget-context';
import { useCategories } from '@/contexts/category-context';

const BudgetOverview = () => {
    const { date } = useDateRange();
    const { formatCurrency } = useCurrency();
    const { transactions } = useTransactions();
    const { budgets } = useBudgets();
    const { categories } = useCategories();


    const processedBudgets = useMemo(() => {
        return budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
            const spent = transactions
                .filter(t => t.categoryId === budget.categoryId && t.type === 'expense' && date?.from && date?.to && isWithinInterval(parseISO(t.date), {start: date.from, end: date.to}))
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                ...budget,
                categoryName: category?.name || 'Unknown',
                spent: spent,
            };
        }).slice(0, 4); // Show only top 4 for overview
    }, [budgets, categories, transactions, date]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {processedBudgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          return (
            <div key={budget.id}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{budget.categoryName}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BudgetOverview;
