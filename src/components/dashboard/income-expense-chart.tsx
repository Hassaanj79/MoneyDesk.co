
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useDateRange } from "@/contexts/date-range-context";
import { format, eachMonthOfInterval, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useTransactions } from "@/contexts/transaction-context";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--primary))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--accent))",
  },
}

type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

const IncomeExpenseChart = () => {
  const { date } = useDateRange();
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const { formatCurrency } = useCurrency();
  const { transactions } = useTransactions();

  useEffect(() => {
    if (date?.from && date?.to) {
      const monthsInInterval = eachMonthOfInterval({
        start: date.from,
        end: date.to,
      });

      const data: MonthlyData[] = monthsInInterval.map(monthStartDate => {
        const monthInterval = {
          start: startOfMonth(monthStartDate),
          end: endOfMonth(monthStartDate),
        };

        const monthTransactions = transactions.filter(t =>
          isWithinInterval(parseISO(t.date), monthInterval)
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          month: format(monthStartDate, "MMM"),
          income,
          expense,
        };
      });

      setChartData(data);
    }
  }, [date, transactions]);

  const fromDate = date?.from ? format(date.from, "LLL dd, y") : null;
  const toDate = date?.to ? format(date.to, "LLL dd, y") : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Expense</CardTitle>
        {fromDate && toDate && (
            <CardDescription>
                {fromDate} - {toDate}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[300px] lg:h-[350px]">
           <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact'})} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
