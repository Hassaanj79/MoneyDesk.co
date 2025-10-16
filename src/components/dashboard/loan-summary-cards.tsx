"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLoans } from "@/contexts/loan-context";
import { useCurrency } from "@/hooks/use-currency";
import { useDateRange } from "@/contexts/date-range-context";
import { ArrowUp, ArrowDown, HandCoins, CreditCard, AlertTriangle } from "lucide-react";
import { format, isAfter, isBefore, isWithinInterval, parseISO } from "date-fns";
import { getPreviousPeriod, getComparisonDescription } from "@/lib/utils";
import { formatAmount } from "@/utils/format-amount";
import { ReceivableBreakdown } from "./receivable-breakdown";
import { PayableBreakdown } from "./payable-breakdown";
import { NetPositionBreakdown } from "./net-position-breakdown";

export function LoanSummaryCards() {
  const { loans } = useLoans();
  const { formatCurrency, currency } = useCurrency();
  const { date } = useDateRange();
  const [showReceivableBreakdown, setShowReceivableBreakdown] = useState(false);
  const [showPayableBreakdown, setShowPayableBreakdown] = useState(false);
  const [showNetPositionBreakdown, setShowNetPositionBreakdown] = useState(false);

  const loanStats = useMemo(() => {
    const now = new Date();
    
    // Calculate accounts receivable (money others owe you - given loans)
    const givenLoans = loans.filter(loan => loan.type === 'given');
    const activeGivenLoans = givenLoans.filter(loan => loan.status === 'active');
    const overdueGivenLoans = activeGivenLoans.filter(loan => isBefore(new Date(loan.dueDate), now));
    
    const totalReceivable = activeGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const overdueReceivable = overdueGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    // Calculate accounts payable (money you owe others - taken loans)
    const takenLoans = loans.filter(loan => loan.type === 'taken');
    const activeTakenLoans = takenLoans.filter(loan => loan.status === 'active');
    const overdueTakenLoans = activeTakenLoans.filter(loan => isBefore(new Date(loan.dueDate), now));
    
    const totalPayable = activeTakenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const overduePayable = overdueTakenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    // Calculate net position (receivable - payable)
    const netPosition = totalReceivable - totalPayable;
    
    // Calculate period change based on selected date range
    const currentPeriod = date;
    const previousPeriod = getPreviousPeriod(date);
    
    const currentPeriodGiven = currentPeriod ? givenLoans.filter(loan => 
      isWithinInterval(new Date(loan.startDate), { start: currentPeriod.from, end: currentPeriod.to })
    ).reduce((sum, loan) => sum + loan.remainingAmount, 0) : 0;
    
    const previousPeriodGiven = previousPeriod ? givenLoans.filter(loan => 
      isWithinInterval(new Date(loan.startDate), { start: previousPeriod.from, end: previousPeriod.to })
    ).reduce((sum, loan) => sum + loan.remainingAmount, 0) : 0;
    
    const currentPeriodTaken = currentPeriod ? takenLoans.filter(loan => 
      isWithinInterval(new Date(loan.startDate), { start: currentPeriod.from, end: currentPeriod.to })
    ).reduce((sum, loan) => sum + loan.remainingAmount, 0) : 0;
    
    const previousPeriodTaken = previousPeriod ? takenLoans.filter(loan => 
      isWithinInterval(new Date(loan.startDate), { start: previousPeriod.from, end: previousPeriod.to })
    ).reduce((sum, loan) => sum + loan.remainingAmount, 0) : 0;
    
    const receivableChange = previousPeriodGiven === 0 ? (currentPeriodGiven > 0 ? "New this period" : "No change") : 
      `${((currentPeriodGiven - previousPeriodGiven) / previousPeriodGiven * 100).toFixed(1)}%`;
    
    const payableChange = previousPeriodTaken === 0 ? (currentPeriodTaken > 0 ? "New this period" : "No change") : 
      `${((currentPeriodTaken - previousPeriodTaken) / previousPeriodTaken * 100).toFixed(1)}%`;
    
    const comparisonDescription = getComparisonDescription(date);

    return {
      totalReceivable,
      overdueReceivable,
      totalPayable,
      overduePayable,
      netPosition,
      receivableChange,
      payableChange,
      comparisonDescription,
      activeGivenCount: activeGivenLoans.length,
      activeTakenCount: activeTakenLoans.length,
      overdueGivenCount: overdueGivenLoans.length,
      overdueTakenCount: overdueTakenLoans.length,
    };
  }, [loans, date]);

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Loans Given Card */}
        <Card 
          className="sm:col-span-1 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowReceivableBreakdown(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loans Given</CardTitle>
            <HandCoins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatAmount(loanStats.totalReceivable, currency)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">{loanStats.receivableChange}</span>
              <span className="ml-1">{loanStats.comparisonDescription}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {loanStats.activeGivenCount} Active
              </Badge>
              {loanStats.overdueGivenCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {loanStats.overdueGivenCount} Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loans Taken Card */}
        <Card 
          className="sm:col-span-1 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowPayableBreakdown(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loans Taken</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatAmount(loanStats.totalPayable, currency)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-red-600 font-medium">{loanStats.payableChange}</span>
              <span className="ml-1">{loanStats.comparisonDescription}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {loanStats.activeTakenCount} Active
              </Badge>
              {loanStats.overdueTakenCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {loanStats.overdueTakenCount} Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Net Position Card */}
      <Card 
        className="sm:col-span-2 lg:col-span-1 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowNetPositionBreakdown(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Position</CardTitle>
          <div className="flex items-center gap-1">
            {loanStats.netPosition >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-600" />
            )}
            {loanStats.overdueReceivable > 0 || loanStats.overduePayable > 0 ? (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-xl sm:text-2xl font-bold ${loanStats.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(Math.abs(loanStats.netPosition), currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {loanStats.netPosition >= 0 ? 'You are owed more' : 'You owe more'}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {loanStats.activeGivenCount + loanStats.activeTakenCount} Total Loans
            </Badge>
            {(loanStats.overdueReceivable > 0 || loanStats.overduePayable > 0) && (
              <Badge variant="destructive" className="text-xs">
                Overdue Amount: {formatAmount(loanStats.overdueReceivable + loanStats.overduePayable, currency)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Receivable Breakdown Modal */}
      <Dialog open={showReceivableBreakdown} onOpenChange={setShowReceivableBreakdown}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loans Given Breakdown</DialogTitle>
          </DialogHeader>
          <ReceivableBreakdown onClose={() => setShowReceivableBreakdown(false)} />
        </DialogContent>
      </Dialog>

      {/* Payable Breakdown Modal */}
      <Dialog open={showPayableBreakdown} onOpenChange={setShowPayableBreakdown}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loans Taken Breakdown</DialogTitle>
          </DialogHeader>
          <PayableBreakdown onClose={() => setShowPayableBreakdown(false)} />
        </DialogContent>
      </Dialog>

      {/* Net Position Breakdown Modal */}
      <Dialog open={showNetPositionBreakdown} onOpenChange={setShowNetPositionBreakdown}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Net Position Breakdown</DialogTitle>
          </DialogHeader>
          <NetPositionBreakdown onClose={() => setShowNetPositionBreakdown(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
