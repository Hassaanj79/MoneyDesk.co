

"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Target className="h-4 w-4 sm:h-5 sm:w-5" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {processedBudgets.length === 0 ? (
          <div className="text-center py-4 sm:py-6">
            <Target className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-medium mb-1">No Budgets Yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
              Create budgets to track your spending and stay on top of your finances
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = '/settings?tab=budgets'}
              className="text-xs sm:text-sm gap-1 sm:gap-2"
            >
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              Create Budget
            </Button>
          </div>
        ) : (
          processedBudgets.map((budget) => {
            return (
              <div key={budget.id} className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm sm:text-base font-medium truncate flex-1 min-w-0">{budget.categoryName}</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {budget.isOverBudget && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />}
                    <span className={`text-xs sm:text-sm font-medium ${budget.status.color}`}>
                      {budget.progress.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-1 gap-2">
                  <span className="truncate min-w-0 flex-1">{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                  <span className="flex-shrink-0">{budget.status.status}</span>
                </div>
                <div className={`w-full rounded-full h-2 sm:h-3 ${budget.status.progressBarBgColor || 'bg-gray-200'} relative`}>
                  <div
                    className={`h-2 sm:h-3 rounded-full transition-all ${budget.status.progressBarColor || 'bg-purple-600'}`}
                    style={{ width: `${Math.min(budget.progress || 0, 100)}%` }}
                  />
                  {budget.isOverBudget && (
                    <div
                      className="h-2 sm:h-3 rounded-full bg-red-500 absolute top-0 left-0 opacity-60"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {budget.isOverBudget ? (
                    <span className="text-red-600 font-medium">
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
