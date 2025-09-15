
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
  iconColor?: string;
  changeColor?: string;
};

const BalanceCard = ({ title, amount, icon: Icon, change, changeDescription, iconColor, changeColor }: BalanceCardProps) => {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");
  const isDateRange = title === 'Date Range';

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">{title}</CardTitle>
        <Icon className={cn("h-5 w-5", iconColor || "text-muted-foreground")} aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className={cn("font-semibold tracking-tight", isDateRange ? "text-base" : "text-3xl")}>{amount}</div>
        <div className="h-5 flex items-end">
          {change ? (
            <p className={cn(
              "text-xs font-medium",
              changeColor || (isPositive && "text-green-700 dark:text-green-400"),
              changeColor || (isNegative && "text-red-700 dark:text-red-400"),
              !changeColor && !isPositive && !isNegative && "text-muted-foreground",
              isDateRange ? "whitespace-nowrap" : ""
            )}>
              {change} {changeDescription || 'from last month'}
            </p>
          ) : (
            <div className="h-5"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
