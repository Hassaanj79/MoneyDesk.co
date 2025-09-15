

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Edit, Trash2, DollarSign } from "lucide-react";
import type { Category, Budget } from "@/types";
import { BudgetForm } from "@/components/budgets/budget-form";
import { useDateRange } from "@/contexts/date-range-context";
import { isWithinInterval, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useTransactions } from "@/contexts/transaction-context";
import { useBudgets } from "@/contexts/budget-context";
import { useCategories } from "@/contexts/category-context";

type BudgetWithDetails = Budget & { spent: number, categoryName: string };

export default function BudgetsPage() {
  const { budgets, deleteBudget } = useBudgets();
  const { categories, addCategory } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithDetails | null>(null);
  const { date } = useDateRange();
  const { formatCurrency } = useCurrency();
  const { transactions } = useTransactions();
  

  const processedBudgets: BudgetWithDetails[] = useMemo(() => {
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
    });
  }, [budgets, categories, transactions, date]);


  const handleAddBudget = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const handleEditBudget = (budget: BudgetWithDetails) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
  };

  const handleSaveSuccess = () => {
    setDialogOpen(false);
    setEditingBudget(null);
  };

  const handleCategoryCreated = async (name: string) => {
      const newCategoryId = await addCategory({ name, type: 'expense' });
      if (!newCategoryId) throw new Error("Failed to create category");
      
      const newCategory: Category = {
          id: newCategoryId,
          name,
          type: 'expense',
          userId: '' // This will be set by the context
      };
      return newCategory;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
        setDialogOpen(isOpen);
        if (!isOpen) {
            setEditingBudget(null);
        }
    }}>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>
              Create and manage your spending budgets.
            </CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button className="ml-auto gap-1" onClick={handleAddBudget}>
              <PlusCircle className="h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          {processedBudgets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {processedBudgets.map((budget) => {
                const percentage = (budget.spent / budget.limit) * 100;
                return (
                  <Card key={budget.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {budget.categoryName}
                        <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" onClick={() => handleEditBudget(budget)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Spent</span>
                          <span>Budget</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-bold">{formatCurrency(budget.spent)}</span>
                          <span className="text-lg font-medium text-muted-foreground">/ {formatCurrency(budget.limit)}</span>
                        </div>
                        <Progress value={percentage} />
                        <div className="text-sm text-muted-foreground">
                          {percentage > 100 
                            ? <p className="text-destructive font-medium">You've overspent by {formatCurrency(budget.spent - budget.limit)}</p>
                            : <p>{formatCurrency(budget.limit - budget.spent)} remaining</p>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <DollarSign className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No budgets created yet.</p>
              <Button className="mt-4" onClick={handleAddBudget}>Create Your First Budget</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingBudget ? "Edit" : "Add"} Budget</DialogTitle>
        </DialogHeader>
        <BudgetForm
          onSuccess={handleSaveSuccess}
          existingBudget={editingBudget}
          allBudgets={processedBudgets}
          onCategoryCreated={handleCategoryCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
