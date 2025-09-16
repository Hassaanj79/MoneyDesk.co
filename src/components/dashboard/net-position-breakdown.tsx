"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoans } from "@/contexts/loan-context";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { ArrowUp, ArrowDown, HandCoins, CreditCard, AlertTriangle, CheckCircle, Calendar, User, TrendingUp, TrendingDown } from "lucide-react";
import { format, isBefore } from "date-fns";

interface NetPositionBreakdownProps {
  onClose: () => void;
}

export function NetPositionBreakdown({ onClose }: NetPositionBreakdownProps) {
  const { loans } = useLoans();
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();

  const netPositionData = useMemo(() => {
    const now = new Date();
    
    // Calculate all loan data
    const givenLoans = loans.filter(loan => loan.type === 'given');
    const takenLoans = loans.filter(loan => loan.type === 'taken');
    
    const activeGivenLoans = givenLoans.filter(loan => loan.status === 'active');
    const activeTakenLoans = takenLoans.filter(loan => loan.status === 'active');
    
    const overdueGivenLoans = activeGivenLoans.filter(loan => isBefore(new Date(loan.dueDate), now));
    const overdueTakenLoans = activeTakenLoans.filter(loan => isBefore(new Date(loan.dueDate), now));
    
    const totalReceivable = activeGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalPayable = activeTakenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const overdueReceivable = overdueGivenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const overduePayable = overdueTakenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    const netPosition = totalReceivable - totalPayable;
    const totalOverdue = overdueReceivable + overduePayable;
    
    // Calculate monthly trends
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthGiven = givenLoans.filter(loan => 
      new Date(loan.startDate) >= thisMonth
    ).reduce((sum, loan) => sum + loan.amount, 0);
    
    const lastMonthGiven = givenLoans.filter(loan => 
      new Date(loan.startDate) >= lastMonth && new Date(loan.startDate) < thisMonth
    ).reduce((sum, loan) => sum + loan.amount, 0);
    
    const thisMonthTaken = takenLoans.filter(loan => 
      new Date(loan.startDate) >= thisMonth
    ).reduce((sum, loan) => sum + loan.amount, 0);
    
    const lastMonthTaken = takenLoans.filter(loan => 
      new Date(loan.startDate) >= lastMonth && new Date(loan.startDate) < thisMonth
    ).reduce((sum, loan) => sum + loan.amount, 0);
    
    const netThisMonth = thisMonthGiven - thisMonthTaken;
    const netLastMonth = lastMonthGiven - lastMonthTaken;
    
    const netChange = netLastMonth === 0 ? (netThisMonth > 0 ? "+100%" : "0%") : 
      `${((netThisMonth - netLastMonth) / Math.abs(netLastMonth) * 100).toFixed(1)}%`;
    
    return {
      totalReceivable,
      totalPayable,
      netPosition,
      overdueReceivable,
      overduePayable,
      totalOverdue,
      activeGivenCount: activeGivenLoans.length,
      activeTakenCount: activeTakenLoans.length,
      overdueGivenCount: overdueGivenLoans.length,
      overdueTakenCount: overdueTakenLoans.length,
      netThisMonth,
      netLastMonth,
      netChange,
      givenLoans: activeGivenLoans,
      takenLoans: activeTakenLoans,
    };
  }, [loans]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivable</CardTitle>
            <HandCoins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(netPositionData.totalReceivable)}
            </div>
            <div className="text-xs text-muted-foreground">
              {netPositionData.activeGivenCount} active loans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(netPositionData.totalPayable)}
            </div>
            <div className="text-xs text-muted-foreground">
              {netPositionData.activeTakenCount} active loans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            {netPositionData.netPosition >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netPositionData.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netPositionData.netPosition))}
            </div>
            <div className="text-xs text-muted-foreground">
              {netPositionData.netPosition >= 0 ? 'Net lender' : 'Net borrower'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(netPositionData.totalOverdue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {netPositionData.overdueGivenCount + netPositionData.overdueTakenCount} overdue loans
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Net Position Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">This Month</div>
              <div className={`text-2xl font-bold ${netPositionData.netThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netPositionData.netThisMonth))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Change from last month</div>
              <div className={`text-lg font-semibold ${netPositionData.netThisMonth >= netPositionData.netLastMonth ? 'text-green-600' : 'text-red-600'}`}>
                {netPositionData.netChange}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Given Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-green-600" />
              Active Loans Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            {netPositionData.givenLoans.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active loans given
              </div>
            ) : (
              <div className="space-y-3">
                {netPositionData.givenLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{loan.borrowerName}</div>
                        <div className="text-sm text-muted-foreground">
                          Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(loan.remainingAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isBefore(new Date(loan.dueDate), new Date()) ? (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Taken Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Active Loans Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            {netPositionData.takenLoans.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active loans taken
              </div>
            ) : (
              <div className="space-y-3">
                {netPositionData.takenLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{loan.borrowerName}</div>
                        <div className="text-sm text-muted-foreground">
                          Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(loan.remainingAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isBefore(new Date(loan.dueDate), new Date()) ? (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
