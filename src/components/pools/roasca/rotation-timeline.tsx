"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, CheckCircle, Clock } from "lucide-react";
import type { MoneyPool, ROSCAPeriod } from "@/types";
import { formatCurrency } from "@/utils/format-amount";

interface RotationTimelineProps {
  pool: MoneyPool;
}

export function RotationTimeline({ pool }: RotationTimelineProps) {
  if (!pool.roscaConfig || !pool.roscaConfig.periods) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rotation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No rotation schedule available</p>
        </CardContent>
      </Card>
    );
  }

  const periods = pool.roscaConfig.periods;
  const currentPeriodIndex = pool.roscaConfig.currentPeriod || 0;

  const getParticipantName = (userId: string) => {
    return pool.participants.find(p => p.userId === userId)?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {periods.map((period, index) => {
            const isCurrent = period.periodIndex === currentPeriodIndex;
            const isUpcoming = period.periodIndex > currentPeriodIndex;
            const isCompleted = period.payoutComplete;
            
            return (
              <div
                key={period.periodIndex}
                className={`p-4 border-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'border-primary bg-primary/5'
                    : isCompleted
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}>
                        Period {period.periodIndex}
                      </Badge>
                      {isCurrent && <Badge variant="default">Current</Badge>}
                      {isCompleted && <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>}
                    </div>
                    <h3 className="font-semibold text-lg">
                      {getParticipantName(period.payoutTo)} receives
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {pool.currency} {period.payoutAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Due: {formatDate(period.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Payout: {formatDate(period.payoutDate)}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-muted/30 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contributions</span>
                    <span className="font-semibold">
                      {period.contributions.length} / {pool.roscaConfig.memberLimit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(period.contributions.length / pool.roscaConfig.memberLimit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

