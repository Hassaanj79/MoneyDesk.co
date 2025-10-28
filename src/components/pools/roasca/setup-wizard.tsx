"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, DollarSign, Users, Calendar, Loader2 } from "lucide-react";

interface ROSCASetupData {
  frequency: 'weekly' | 'monthly';
  contributionAmount: number;
  memberLimit: number;
  rotationMode: 'fixed_order' | 'ballot_draw';
  startDate: string;
}

interface ROSCASetupWizardProps {
  onComplete: (data: ROSCASetupData) => void;
  onCancel: () => void;
}

export function ROSCASetupWizard({ onComplete, onCancel }: ROSCASetupWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ROSCASetupData>({
    frequency: 'monthly',
    contributionAmount: 0,
    memberLimit: 6,
    rotationMode: 'fixed_order',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.contributionAmount > 0 && data.memberLimit >= 2;
      case 2:
        return true;
      case 3:
        return data.startDate && new Date(data.startDate) >= new Date();
      default:
        return true;
    }
  };

  const potAmount = data.contributionAmount * data.memberLimit;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">ROSCA Setup Wizard</CardTitle>
            <CardDescription>Step {step} of 3</CardDescription>
          </div>
          <Badge variant="outline">{potAmount.toLocaleString()} PKR Pot</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Basic Configuration */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberCount">Number of Members</Label>
                  <Input
                    id="memberCount"
                    type="number"
                    min="2"
                    max="20"
                    value={data.memberLimit}
                    onChange={(e) => setData({ ...data, memberLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contribution">Contribution per Member</Label>
                  <Input
                    id="contribution"
                    type="number"
                    min="1"
                    value={data.contributionAmount}
                    onChange={(e) => setData({ ...data, contributionAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={data.frequency} onValueChange={(value: any) => setData({ ...data, frequency: value })}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="font-semibold mb-2">Pool Summary</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{data.memberLimit} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{data.contributionAmount.toLocaleString()} PKR each</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <p className="font-bold text-lg">Total Pot: {potAmount.toLocaleString()} PKR</p>
                  <p className="text-xs text-muted-foreground">
                    One member receives {potAmount.toLocaleString()} PKR each {data.frequency === 'weekly' ? 'week' : 'month'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Rotation Mode */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Rotation Mode</h3>
              
              <div className="space-y-4">
                <Card 
                  className={`cursor-pointer border-2 ${data.rotationMode === 'fixed_order' ? 'border-primary' : ''}`}
                  onClick={() => setData({ ...data, rotationMode: 'fixed_order' })}
                >
                  <CardHeader>
                    <CardTitle className="text-base">Fixed Order</CardTitle>
                    <CardDescription>
                      Members receive payout in the order they joined (first come, first served)
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className={`cursor-pointer border-2 ${data.rotationMode === 'ballot_draw' ? 'border-primary' : ''}`}
                  onClick={() => setData({ ...data, rotationMode: 'ballot_draw' })}
                >
                  <CardHeader>
                    <CardTitle className="text-base">Ballot Draw</CardTitle>
                    <CardDescription>
                      Random order assigned fairly when pool starts
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Start Date */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Start Date</h3>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">When should the ROSCA start?</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Select the date when the first contribution is due
                </p>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold mb-3">Final Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-semibold">{data.memberLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contribution:</span>
                    <span className="font-semibold">{data.contributionAmount.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <Badge className="capitalize">{data.frequency}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode:</span>
                    <Badge variant="outline" className="capitalize">{data.rotationMode.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pot Size:</span>
                    <span className="font-bold text-primary">{potAmount.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-semibold">{new Date(data.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === 3 ? 'Create ROSCA' : 'Next'}
            {step < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

