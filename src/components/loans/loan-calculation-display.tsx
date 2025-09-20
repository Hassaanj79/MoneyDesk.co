"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Percent, Calendar, TrendingUp } from "lucide-react";
import { getLoanCalculation, formatCurrency, formatPercentage } from "@/lib/loan-calculations";
import { useCurrency } from "@/hooks/use-currency";

interface LoanCalculationDisplayProps {
  principal: number;
  interestRate: number;
  startDate: Date;
  dueDate: Date;
  calculationType?: 'simple' | 'compound' | 'payment';
}

export function LoanCalculationDisplay({
  principal,
  interestRate,
  startDate,
  dueDate,
  calculationType = 'simple'
}: LoanCalculationDisplayProps) {
  const { formatCurrency: formatCurrencyHook } = useCurrency();

  const calculation = useMemo(() => {
    return getLoanCalculation(principal, interestRate, startDate, dueDate, calculationType);
  }, [principal, interestRate, startDate, dueDate, calculationType]);

  const timeInYears = useMemo(() => {
    const timeDiff = dueDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff / 365.25;
  }, [startDate, dueDate]);

  const isNoInterest = interestRate === 0;
  const isLongTerm = timeInYears > 1;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Calculator className="h-5 w-5" />
          Loan Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Principal Amount (What you're giving) */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Amount to Give</span>
          </div>
          <span className="font-bold text-lg">
            {formatCurrencyHook(calculation.principal)}
          </span>
        </div>

        {/* Interest Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Interest Amount</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg">
                {formatCurrencyHook(calculation.interestRate)}
              </span>
              {isNoInterest && (
                <Badge variant="secondary" className="ml-2">No Interest</Badge>
              )}
            </div>
          </div>

        </div>

        {/* Time Period */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Loan Period</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg">
              {timeInYears < 1 
                ? `${Math.round(timeInYears * 12)} months`
                : `${timeInYears.toFixed(1)} years`
              }
            </span>
            {isLongTerm && (
              <Badge variant="outline" className="ml-2">Long Term</Badge>
            )}
          </div>
        </div>

        {/* Total Amount - Highlighted */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="font-bold text-xl text-green-700 dark:text-green-300">
                Total Amount to Receive
              </span>
            </div>
            <span className="font-bold text-2xl text-green-700 dark:text-green-300">
              {formatCurrencyHook(calculation.totalAmount)}
            </span>
          </div>
          <div className="text-center mt-2">
            <div className="text-sm text-muted-foreground">
              This amount will be deducted from your account
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {calculation.monthlyPayment && (
          <div className="text-sm text-muted-foreground bg-white dark:bg-gray-900 p-3 rounded-lg border">
            <div className="flex justify-between">
              <span>Monthly Payment:</span>
              <span className="font-medium">
                {formatCurrencyHook(calculation.monthlyPayment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Payments:</span>
              <span className="font-medium">
                {calculation.totalPayments} payments
              </span>
            </div>
          </div>
        )}

        {/* Calculation Type Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            {calculationType === 'simple' && 'Simple Interest'}
            {calculationType === 'compound' && 'Compound Interest'}
            {calculationType === 'payment' && 'Monthly Payment Plan'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
