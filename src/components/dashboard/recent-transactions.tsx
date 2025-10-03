
"use client"

import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowUp, Car, Clapperboard, ShoppingBag, UtensilsCrossed, Home, Wrench, Dumbbell, Gift } from "lucide-react";
import Link from "next/link";
import { useTransactions } from "@/contexts/transaction-context";
import { useDateRange } from "@/contexts/date-range-context";
import { isWithinInterval, parseISO, format } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";

const categoryIcons: { [key: string]: React.ElementType } = {
    "Food": UtensilsCrossed,
    "Income": ArrowUp,
    "Shopping": ShoppingBag,
    "Transport": Car,
    "Entertainment": Clapperboard,
    "Groceries": UtensilsCrossed,
    "Housing": Home,
    "Utilities": Wrench,
    "Health": Dumbbell,
    "Investment": ArrowUp,
    "Gifts": Gift,
    "Freelance": ArrowUp,
    "Salary": ArrowUp,
};

const RecentTransactions = () => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { date } = useDateRange();
  const { formatCurrency } = useCurrency();

  // Helper function to safely convert date to Date object
  const getDate = (dateValue: any): Date => {
    if (typeof dateValue === 'string') {
      return parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore timestamp
      return dateValue.toDate();
    } else if (dateValue && typeof dateValue.toISOString === 'function') {
      return new Date(dateValue.toISOString());
    }
    return new Date(); // fallback
  };

  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => getDate(b.date).getTime() - getDate(a.date).getTime());
    if (date?.from && date?.to) {
        return sorted.filter((t) =>
            isWithinInterval(getDate(t.date), { start: date.from!, end: date.to! })
        ).slice(0, 5);
    }
    return sorted.slice(0, 5);
  }, [transactions, date]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "N/A";
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <CardTitle>Recent Transactions</CardTitle>
        <Button asChild size="sm" variant="ghost" className="ml-auto gap-1">
          <Link href="/transactions">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">No Transactions Yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Start tracking your income and expenses to see them here
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = '/transactions'}
              className="text-xs"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => {
              const categoryName = getCategoryName(transaction.categoryId);
              const Icon = categoryIcons[categoryName] || UtensilsCrossed;
              return (
                <div key={transaction.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.name}</p>
                    <p className="text-sm text-muted-foreground">{format(getDate(transaction.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className={`ml-auto font-medium ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
