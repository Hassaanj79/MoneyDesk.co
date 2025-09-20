
"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactions } from "@/contexts/transaction-context";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import { ArrowUp, ArrowDown, Scale, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";

type RecapStoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
};

export function RecapStory({ open, onOpenChange }: RecapStoryProps) {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();
  const now = new Date();

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }

  const recapData = useMemo(() => {
    const processPeriod = (
      name: string,
      currentInterval: Interval,
      previousInterval: Interval
    ) => {
      const currentTransactions = transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), currentInterval)
      );
      const previousTransactions = transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), previousInterval)
      );

      const currentIncome = currentTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const currentExpense = currentTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const previousExpense = previousTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const spendingByCategory = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const categoryName = getCategoryName(t.categoryId);
            if (!acc[categoryName]) {
                acc[categoryName] = 0;
            }
            acc[categoryName] += t.amount;
            return acc;
        }, {} as Record<string, number>);

      const topCategory = Object.entries(spendingByCategory).sort((a,b) => b[1] - a[1])[0];

      const expenseChange = previousExpense === 0 
        ? currentExpense > 0 ? 100 : 0
        : ((currentExpense - previousExpense) / previousExpense) * 100;
        
      return {
        name,
        dateRange: `${format(currentInterval.start, "MMM d")} - ${format(currentInterval.end, "MMM d, yyyy")}`,
        totalIncome: currentIncome,
        totalExpense: currentExpense,
        netSavings: currentIncome - currentExpense,
        expenseChange: expenseChange.toFixed(1),
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1]} : null,
        spendingData: Object.entries(spendingByCategory)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a,b) => b.amount - a.amount).slice(0, 5),
      };
    };

    return [
      processPeriod(
        "This Week's Recap",
        { start: startOfWeek(now), end: endOfWeek(now) },
        { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) }
      ),
      processPeriod(
        "This Month's Recap",
        { start: startOfMonth(now), end: endOfMonth(now) },
        { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
      ),
      processPeriod(
        "This Year's Recap",
        { start: startOfYear(now), end: endOfYear(now) },
        { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) }
      ),
    ];
  }, [transactions, now, categories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Financial Story</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <Carousel className="w-full h-full flex-1">
          <CarouselContent>
            {recapData.map((recap, index) => (
              <CarouselItem key={index} className="flex flex-col">
                <div className="p-4 text-center">
                    <h3 className="text-2xl font-bold">{recap.name}</h3>
                    <p className="text-muted-foreground">{recap.dateRange}</p>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    <div className="grid grid-cols-2 gap-4">
                         <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <ArrowUp className="h-8 w-8 text-green-500 mb-2"/>
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <p className="text-2xl font-bold">{formatCurrency(recap.totalIncome)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <ArrowDown className="h-8 w-8 text-red-500 mb-2"/>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="text-2xl font-bold">{formatCurrency(recap.totalExpense)}</p>
                                <p className={`text-xs ${parseFloat(recap.expenseChange) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {parseFloat(recap.expenseChange).toFixed(1)}% vs last period
                                </p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Scale className="h-8 w-8 text-muted-foreground mb-2"/>
                                <p className="text-sm text-muted-foreground">Net Savings</p>
                                <p className="text-2xl font-bold">{formatCurrency(recap.netSavings)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <PieChart className="h-8 w-8 text-primary mb-2"/>
                                <p className="text-sm text-muted-foreground">Top Category</p>
                                {recap.topCategory ? (
                                    <>
                                        <p className="text-lg font-bold">{recap.topCategory.name}</p>
                                        <p className="text-muted-foreground">{formatCurrency(recap.topCategory.amount)}</p>
                                    </>
                                ) : <p className="text-lg font-bold">N/A</p>}
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardContent className="p-4">
                             <h4 className="text-center font-semibold mb-4">Top 5 Spending Categories</h4>
                            <div className="h-[250px]">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <BarChart layout="vertical" accessibilityLayer data={recap.spendingData} margin={{ left: 10, right: 30 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={80}/>
                                        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                                        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
