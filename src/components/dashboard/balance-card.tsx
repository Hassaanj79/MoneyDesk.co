
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type BalanceCardProps = {
  title: string;
  amount: string;
  icon: LucideIcon;
  change?: string;
  changeDescription?: string;
};

const BalanceCard = ({ title, amount, icon: Icon, change, changeDescription }: BalanceCardProps) => {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");
  const isDateRange = title === 'Date Range';

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className={cn("font-semibold tracking-tight", isDateRange ? "text-base" : "text-3xl")}>{amount}</div>
        {change && (
          <p className={cn(
            "text-xs font-medium",
            isPositive && "text-green-700 dark:text-green-400",
            isNegative && "text-red-700 dark:text-red-400",
            !isPositive && !isNegative && "text-muted-foreground",
            isDateRange ? "whitespace-nowrap" : ""
          )}>
            {change} {changeDescription || 'from last month'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
