

"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDateRange } from '@/contexts/date-range-context';
import { useCurrency } from '@/hooks/use-currency';
import { useTransactions } from '@/contexts/transaction-context';
import { useBudgets } from '@/contexts/budget-context';
import { useCategories } from '@/contexts/category-context';
import { calculateBudgetProgress, getBudgetStatus } from '@/lib/budget-utils';
import { Target, AlertCircle } from 'lucide-react';

const BudgetOverview = () => {
    const { date } = useDateRange();
    const { formatCurrency } = useCurrency();
    const { transactions } = useTransactions();
    const { budgets } = useBudgets();
    const { categories } = useCategories();


    const processedBudgets = useMemo(() => {
        return budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
            const budgetData = calculateBudgetProgress(budget, transactions);
            const status = getBudgetStatus(budgetData.progress);
            
            
            return {
                ...budget,
                categoryName: category?.name || 'Unknown',
                ...budgetData,
                status
            };
        }).slice(0, 4); // Show only top 4 for overview
    }, [budgets, categories, transactions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {processedBudgets.length === 0 ? (
          <div className="text-center py-4">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No budgets created yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create budgets in Settings to track your spending
            </p>
          </div>
        ) : (
          processedBudgets.map((budget) => {
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{budget.categoryName}</span>
                  <div className="flex items-center gap-2">
                    {budget.isOverBudget && <AlertCircle className="h-4 w-4 text-orange-500" />}
                    <span className={`text-sm font-medium ${budget.status.color}`}>
                      {budget.progress.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                  <span>{budget.status.status}</span>
                </div>
                <div className={`w-full rounded-full h-2 ${budget.status.progressBarBgColor || 'bg-gray-200'}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${budget.status.progressBarColor || 'bg-purple-600'}`}
                    style={{ width: `${Math.min(budget.progress || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {budget.isOverBudget ? (
                    <span className="text-red-600">
                      Over budget by {formatCurrency(budget.spent - budget.amount)}
                    </span>
                  ) : (
                    <span>
                      {formatCurrency(budget.remaining)} remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetOverview;
