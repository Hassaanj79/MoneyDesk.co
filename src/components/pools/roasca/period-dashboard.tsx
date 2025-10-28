"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, DollarSign, Users, Loader2 } from "lucide-react";
import type { MoneyPool, ROSCAPeriod } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PeriodDashboardProps {
  pool: MoneyPool;
  currentPeriod: ROSCAPeriod | null;
  onContributionAdd: (periodIndex: number, amount: number, notes?: string) => Promise<void>;
  onPayoutComplete: (periodIndex: number) => Promise<void>;
}

export function PeriodDashboard({
  pool,
  currentPeriod,
  onContributionAdd,
  onPayoutComplete,
}: PeriodDashboardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [notes, setNotes] = useState("");

  if (!pool.roscaConfig || !currentPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Period Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active period</p>
        </CardContent>
      </Card>
    );
  }

  const totalContributed = currentPeriod.contributions.reduce(
    (sum, c) => sum + c.amountPaid,
    0
  );
  const completionRate = (currentPeriod.contributions.length / pool.roscaConfig.memberLimit) * 100;
  const daysUntilPayout = Math.ceil(
    (new Date(currentPeriod.payoutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const canCompletePayout = currentPeriod.contributions.length === pool.roscaConfig.memberLimit;

  const handleContribution = async () => {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      return;
    }

    setIsProcessing(true);
    try {
      await onContributionAdd(currentPeriod.periodIndex, amount, notes);
      setContributionAmount("");
      setNotes("");
    } catch (error) {
      console.error("Error adding contribution:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayout = async () => {
    setIsProcessing(true);
    try {
      await onPayoutComplete(currentPeriod.periodIndex);
    } catch (error) {
      console.error("Error completing payout:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Period: {currentPeriod.periodIndex}</CardTitle>
            <CardDescription>
              Payout to {pool.participants.find(p => p.userId === currentPeriod.payoutTo)?.name || 'Unknown'}
            </CardDescription>
          </div>
          <Badge variant={canCompletePayout ? 'default' : 'secondary'}>
            {canCompletePayout ? 'Ready' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={completionRate} />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{currentPeriod.contributions.length}</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{totalContributed.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{pool.currency}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{daysUntilPayout}</p>
              <p className="text-xs text-muted-foreground">Days left</p>
            </div>
          </div>
        </div>

        {/* Deadline Info */}
        <div className="p-4 border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              Contributions Due: {new Date(currentPeriod.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              Payout Date: {new Date(currentPeriod.payoutDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Contribution Form */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Add Contribution</h3>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this contribution"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleContribution}
            disabled={!contributionAmount || isProcessing}
            className="w-full"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Contribution
          </Button>
        </div>

        {/* Contributions List */}
        <div className="space-y-2">
          <h3 className="font-semibold">Contributions Received</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentPeriod.contributions.map((contribution, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {pool.participants.find(p => p.userId === contribution.memberId)?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contribution.paidAt ? new Date(contribution.paidAt).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{pool.currency} {contribution.amountPaid.toLocaleString()}</p>
                  {contribution.notes && (
                    <p className="text-xs text-muted-foreground truncate max-w-32">
                      {contribution.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Payout Button */}
        {canCompletePayout && !currentPeriod.payoutComplete && (
          <Button
            onClick={handlePayout}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Payout ({pool.currency} {currentPeriod.payoutAmount.toLocaleString()})
              </>
            )}
          </Button>
        )}

        {currentPeriod.payoutComplete && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                Payout completed on {new Date(currentPeriod.payoutDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

