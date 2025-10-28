"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Target, TrendingUp, Clock, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ModuleAccessGuard } from "@/components/module-access-guard";
import { useAuth } from "@/contexts/auth-context";
import { useModuleAccess } from "@/contexts/module-access-context";
import { createPool, subscribeToUserPools, deletePool, updatePool } from "@/services/pools";
import type { MoneyPool } from "@/types";
import { Badge } from "@/components/ui/badge";
import { sendBillSplitNotification, calculateParticipantShare } from "@/services/bill-split-notifications";

export default function MoneyPoolsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [poolType, setPoolType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [pools, setPools] = useState<MoneyPool[]>([]);
  const [splitParticipants, setSplitParticipants] = useState<Array<{name: string, email: string}>>([]);
  const [selectedPool, setSelectedPool] = useState<MoneyPool | null>(null);
  const [showPoolDetails, setShowPoolDetails] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [selectedContributorId, setSelectedContributorId] = useState<string>("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  // Contribution form refs
  const contributionAmountRef = useRef<HTMLInputElement>(null);
  const contributionNotesRef = useRef<HTMLTextAreaElement>(null);
  const contributionParticipantRef = useRef<HTMLButtonElement>(null);
  
  // Form refs
  const poolNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const targetAmountRef = useRef<HTMLInputElement>(null);
  const memberCountRef = useRef<HTMLInputElement>(null);
  const roscaContributionAmountRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const recurringFrequencyRef = useRef<HTMLButtonElement>(null);
  const roscaFrequencyRef = useRef<HTMLButtonElement>(null);
  const rotationModeRef = useRef<HTMLButtonElement>(null);
  
  const { user } = useAuth();
  const { moduleAccess, userSubscription } = useModuleAccess();

  // Subscribe to user's pools
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToUserPools(user.uid, (poolsData) => {
      setPools(poolsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRemoveParticipant = async (participantId: string, participantName: string) => {
    if (!selectedPool || !user) {
      toast.error("Unable to remove participant");
      return;
    }

    // Don't allow removing the pool creator
    if (participantId === selectedPool.createdBy) {
      toast.error("Cannot remove the pool creator");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${participantName} from this pool?`)) {
      return;
    }

    try {
      console.log("Removing participant:", participantId, participantName);

      // Remove participant from the pool
      const updatedParticipants = selectedPool.participants.filter(p => p.userId !== participantId);
      
      // Remove any contributions from this participant
      const updatedContributions = selectedPool.contributions.filter(c => c.userId !== participantId);
      
      // Calculate new collected amount
      const newCollectedAmount = updatedContributions.reduce((sum, c) => sum + c.amount, 0);

      await updatePool(selectedPool.id, {
        participants: updatedParticipants,
        contributions: updatedContributions,
        collectedAmount: newCollectedAmount,
        activityLog: [
          ...selectedPool.activityLog,
          {
            timestamp: new Date().toISOString(),
            type: "withdrawn",
            userId: participantId,
            description: `${participantName} removed from the pool`,
          }
        ]
      });

      console.log("✅ Participant removed successfully");

      // Update the selectedPool state
      setSelectedPool({
        ...selectedPool,
        participants: updatedParticipants,
        contributions: updatedContributions,
        collectedAmount: newCollectedAmount,
      });

      // Update the pools list
      setPools(pools.map(p => 
        p.id === selectedPool.id 
          ? { 
              ...p, 
              participants: updatedParticipants,
              contributions: updatedContributions,
              collectedAmount: newCollectedAmount,
            }
          : p
      ));

      toast.success(`${participantName} removed from the pool`);
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant");
    }
  };

  const handleInviteParticipant = async () => {
    if (!selectedPool || !inviteName || !inviteEmail || !user) {
      toast.error("Please fill in name and email");
      return;
    }

    console.log("Starting invitation process...");
    console.log("Pool:", selectedPool.id);
    console.log("Invitee:", inviteName, inviteEmail);

    try {
      // Add participant to the pool immediately
      const newParticipant = {
        userId: Date.now().toString(),
        email: inviteEmail,
        name: inviteName,
        joinedAt: new Date().toISOString(),
        isActive: true,
        contributionAmount: 0,
      };

      console.log("Creating new participant:", newParticipant);

      const updatedParticipants = [...selectedPool.participants, newParticipant];

      console.log("Updating pool with participants:", updatedParticipants.length);

      await updatePool(selectedPool.id, {
        participants: updatedParticipants,
        activityLog: [
          ...selectedPool.activityLog,
          {
            timestamp: new Date().toISOString(),
            type: "joined",
            userId: newParticipant.userId,
            description: `${inviteName} invited to the pool (invitation sent)`,
          }
        ]
      });

      console.log("✅ Participant added to pool");

      // Send bill split notification if this is a split bill pool
      if (selectedPool.type === 'split' && selectedPool.targetAmount > 0) {
        try {
          const totalParticipants = updatedParticipants.length;
          const participantShare = calculateParticipantShare(selectedPool.targetAmount, totalParticipants);
          
          console.log("💰 Sending bill split notification...");
          console.log("Total amount:", selectedPool.targetAmount);
          console.log("Total participants:", totalParticipants);
          console.log("Participant share:", participantShare);

          const notificationResult = await sendBillSplitNotification({
            participantEmail: inviteEmail,
            participantName: inviteName,
            poolName: selectedPool.name,
            totalAmount: selectedPool.targetAmount,
            participantShare: participantShare,
            totalParticipants: totalParticipants,
            addedBy: user.uid,
            addedByName: user.displayName || user.email?.split('@')[0] || 'User',
            currency: 'USD' // Could be made dynamic based on user settings
          });

          if (notificationResult.success) {
            console.log("✅ Bill split notification sent");
            toast.success(`${inviteName} added to pool! They'll receive an email with their share amount ($${participantShare.toFixed(2)}).`);
          } else {
            console.warn("⚠️ Bill split notification failed:", notificationResult.message);
            toast.success(`${inviteName} added to pool! (Email notification may have failed)`);
          }
        } catch (notificationError) {
          console.error("Error sending bill split notification:", notificationError);
          toast.success(`${inviteName} added to pool! (Email notification may have failed)`);
        }
      } else {
        // Send regular invitation for non-split pools
        try {
          const response = await fetch('/api/pools/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              poolId: selectedPool.id,
              inviteeEmail: inviteEmail,
              inviteeName: inviteName,
              invitedBy: user.uid,
              invitedByEmail: user.email || '',
              poolName: selectedPool.name,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            console.log("✅ Invitation email sent");
            toast.success(`Invitation sent to ${inviteName}! They'll receive an email with a join code.`);
          } else {
            console.warn("⚠️ Email sending failed:", result.error);
            toast.success(`${inviteName} added to pool! (Email notification may have failed)`);
          }
        } catch (emailError) {
          console.error("Error sending invitation email:", emailError);
          toast.success(`${inviteName} added to pool! (Email notification may have failed)`);
        }
      }

      setShowInviteDialog(false);
      setInviteName("");
      setInviteEmail("");
      
      // Update the selectedPool state to reflect the new participant
      setSelectedPool({
        ...selectedPool,
        participants: updatedParticipants,
      });
      
      // Also update in the pools list
      setPools(pools.map(p => 
        p.id === selectedPool.id 
          ? { ...p, participants: updatedParticipants }
          : p
      ));
    } catch (error) {
      console.error("Error inviting participant:", error);
      toast.error("Failed to add participant");
    }
  };

  const handleAddContribution = async () => {
    if (!selectedPool || !contributionAmountRef.current?.value) {
      toast.error("Please enter contribution amount");
      return;
    }

    const amount = parseFloat(contributionAmountRef.current.value);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      // Get the selected contributor ID or use current user
      const contributorId = selectedContributorId || user?.uid || "unknown";
      
      const newContribution = {
        id: Date.now().toString(),
        poolId: selectedPool.id,
        userId: contributorId,
        amount: amount,
        notes: contributionNotesRef.current?.value || "",
        createdAt: new Date().toISOString(),
        status: 'confirmed' as const,
      };

      // Update pool's contributions array
      const updatedContributions = [...(selectedPool.contributions || []), newContribution];
      
      // Update participant's contribution amount
      const updatedParticipants = selectedPool.participants.map(p => 
        p.userId === contributorId
          ? { ...p, contributionAmount: p.contributionAmount + amount }
          : p
      );

      // Update pool
      await updatePool(selectedPool.id, {
        contributions: updatedContributions,
        participants: updatedParticipants,
        collectedAmount: selectedPool.collectedAmount + amount,
        activityLog: [
          ...selectedPool.activityLog,
            {
            timestamp: new Date().toISOString(),
            type: "contributed",
            userId: contributorId,
            description: `Contributed ${selectedPool.currency} ${amount.toLocaleString()}`,
          }
        ]
      });

      toast.success("Contribution added successfully!");
      setShowAddContribution(false);
      setSelectedContributorId(""); // Reset selection
      
      // Clear form
      if (contributionAmountRef.current) contributionAmountRef.current.value = "";
      if (contributionNotesRef.current) contributionNotesRef.current.value = "";
    } catch (error) {
      console.error("Error adding contribution:", error);
      toast.error("Failed to add contribution");
    }
  };

  const addSplitParticipant = () => {
    setSplitParticipants([...splitParticipants, { name: '', email: '' }]);
  };

  const removeSplitParticipant = (index: number) => {
    setSplitParticipants(splitParticipants.filter((_, i) => i !== index));
  };

  const updateSplitParticipant = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...splitParticipants];
    updated[index] = { ...updated[index], [field]: value };
    setSplitParticipants(updated);
  };

  const handleCreatePool = async () => {
    if (!user) {
      toast.error("You must be logged in to create a pool");
      return;
    }

    if (!poolNameRef.current?.value) {
      toast.error("Please enter a pool name");
      return;
    }

    if (!poolType) {
      toast.error("Please select a pool type");
      return;
    }

    // Validate target amount for non-ROSCA pools
    if (poolType !== "roasca") {
      const targetAmount = parseFloat(targetAmountRef.current?.value || "0");
      if (!targetAmount || targetAmount <= 0) {
        toast.error("Please enter a valid target amount");
        return;
      }
    }

    // Validate ROSCA-specific fields
    if (poolType === "roasca") {
      const memberCount = parseInt(memberCountRef.current?.value || "0");
      const contributionAmount = parseFloat(roscaContributionAmountRef.current?.value || "0");
      
      if (!memberCount || memberCount < 2) {
        toast.error("Please enter at least 2 members");
        return;
      }
      
      if (!contributionAmount || contributionAmount <= 0) {
        toast.error("Please enter a valid contribution amount");
        return;
      }
    }

    setIsCreating(true);

    try {
      console.log("Creating pool with type:", poolType);
      
      const poolData = {
        name: poolNameRef.current.value,
        description: descriptionRef.current?.value || "",
        createdBy: user.uid,
        currency: "PKR", // TODO: Get from user settings
        poolType,
        status: "active" as const,
        visibility: "private" as const,
        autoComplete: false,
        startDate: new Date().toISOString(),
        endDate: endDateRef.current?.value || undefined,
        targetAmount: poolType === "roasca" ? 
          (parseFloat(roscaContributionAmountRef.current?.value || "0") * parseInt(memberCountRef.current?.value || "0")) :
          parseFloat(targetAmountRef.current?.value || "0"),
        collectedAmount: 0,
        participants: [
          {
            userId: user.uid,
            email: user.email || "",
            name: user.displayName || user.email || "User",
            joinedAt: new Date().toISOString(),
            isActive: true,
            contributionAmount: 0,
          },
          // Add other participants for split bill
          ...(poolType === "split_bill" ? splitParticipants.map((p, index) => ({
            userId: `pending_${index}`,
            email: p.email,
            name: p.name,
            joinedAt: new Date().toISOString(),
            isActive: true,
            contributionAmount: 0,
          })) : [])
        ],
        contributions: [],
        activityLog: [{
          timestamp: new Date().toISOString(),
          type: "created",
          userId: user.uid,
          description: `Pool "${poolNameRef.current.value}" created`,
        }],
      };

      // Add ROSCA-specific config if ROSCA type
      if (poolType === "roasca") {
        (poolData as any).roscaConfig = {
          frequency: "monthly",
          contributionAmount: parseFloat(roscaContributionAmountRef.current?.value || "0"),
          memberLimit: parseInt(memberCountRef.current?.value || "0"),
          rotationMode: "fixed_order",
          startDate: new Date().toISOString(),
          currentPeriod: 0,
          rotationOrder: [],
          periods: [],
        };
      }

      console.log("Pool data:", poolData);
      const poolId = await createPool(poolData);
      console.log("Pool created successfully with ID:", poolId);
      
      toast.success("Pool created successfully!");
      
      // Reset form and close dialog
      setPoolType("");
      setSplitParticipants([]);
      setCreateDialogOpen(false);
      
      // Clear all form fields
      if (poolNameRef.current) poolNameRef.current.value = "";
      if (descriptionRef.current) descriptionRef.current.value = "";
      if (targetAmountRef.current) targetAmountRef.current.value = "";
      if (memberCountRef.current) memberCountRef.current.value = "";
      if (roscaContributionAmountRef.current) roscaContributionAmountRef.current.value = "";
      if (endDateRef.current) endDateRef.current.value = "";
    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error(`Failed to create pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModuleAccessGuard 
      module="pools" 
      userModuleAccess={moduleAccess}
      userSubscription={userSubscription}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Money Pools</h1>
          <p className="text-muted-foreground">
            Create and manage group money pools for splitting bills, fundraising, and shared goals
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Money Pool</DialogTitle>
              <DialogDescription>
                Create a new money pool for splitting expenses, fundraising, or group savings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="poolName">Pool Name</Label>
                <Input id="poolName" ref={poolNameRef} placeholder="e.g., Apartment Rent" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" ref={descriptionRef} placeholder="Add details about this pool..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input id="targetAmount" ref={targetAmountRef} type="number" placeholder="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poolType">Pool Type</Label>
                  <Select value={poolType} onValueChange={setPoolType}>
                    <SelectTrigger id="poolType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="split_bill">Split Bill</SelectItem>
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="goal_saving">Goal Saving</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="roasca">ROSCA (Bachat Committee)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {poolType === "recurring" && (
                <div className="space-y-2">
                  <Label htmlFor="recurringPeriod">Recurring Frequency</Label>
                  <Select>
                    <SelectTrigger id="recurringPeriod">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {poolType === "roasca" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    ROSCA (Rotating Savings) Configuration
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberCount">Number of Members</Label>
                      <Input id="memberCount" ref={memberCountRef} type="number" min="2" max="20" placeholder="e.g., 6" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contributionAmount">Contribution per Member</Label>
                      <Input id="contributionAmount" ref={roscaContributionAmountRef} type="number" min="1" placeholder="e.g., 10000" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roscaFrequency">Frequency</Label>
                      <Select>
                        <SelectTrigger id="roscaFrequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rotationMode">Rotation Mode</Label>
                      <Select>
                        <SelectTrigger id="rotationMode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_order">Fixed Order</SelectItem>
                          <SelectItem value="ballot_draw">Ballot Draw</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">How ROSCA works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Each member contributes the same amount regularly</li>
                      <li>One member receives the total pot (contribution × members) each period</li>
                      <li>Rotation continues until everyone has received once</li>
                    </ul>
                  </div>
                </div>
              )}
              {poolType === "split_bill" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Other Participants</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSplitParticipant}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Person
                    </Button>
                  </div>
                  
                  {splitParticipants.map((participant, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2">
                        <Input
                          placeholder="Name"
                          value={participant.name}
                          onChange={(e) => updateSplitParticipant(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="email"
                          placeholder="Email"
                          value={participant.email}
                          onChange={(e) => updateSplitParticipant(index, 'email', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSplitParticipant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  
                  {splitParticipants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click "Add Person" to include others in this split bill
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input id="endDate" ref={endDateRef} type="date" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePool}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Pool"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pools List or Empty State */}
      {pools.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No Money Pools Yet</CardTitle>
            <CardDescription>
              Start by creating a money pool to split expenses, collect funds, or save together with friends.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Pool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => (
            <Card key={pool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{pool.name}</CardTitle>
                      <Badge variant={pool.status === 'active' ? 'default' : pool.status === 'completed' ? 'secondary' : 'destructive'}>
                        {pool.status}
                      </Badge>
                    </div>
                    {pool.description && (
                      <CardDescription>{pool.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePool(pool.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Target Amount</p>
                      <p className="font-semibold">{pool.currency} {pool.targetAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Collected</p>
                      <p className="font-semibold">{pool.currency} {pool.collectedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-semibold">{pool.participants.length} participants</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(pool.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPool(pool);
                        setShowPoolDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Badge variant="outline" className="capitalize">
                      {pool.poolType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pool Details Dialog */}
      <Dialog open={showPoolDetails} onOpenChange={setShowPoolDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPool && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPool.name}</DialogTitle>
                <DialogDescription>{selectedPool.description || "Pool details and contributions"}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Pool Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Target Amount</CardTitle>
                      <p className="text-2xl font-bold">{selectedPool.currency} {selectedPool.targetAmount.toLocaleString()}</p>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Collected</CardTitle>
                      <p className="text-2xl font-bold">{selectedPool.currency} {selectedPool.collectedAmount.toLocaleString()}</p>
                    </CardHeader>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {Math.round((selectedPool.collectedAmount / selectedPool.targetAmount) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (selectedPool.collectedAmount / selectedPool.targetAmount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Participants ({selectedPool.participants.length})</h3>
                  <div className="space-y-2">
                    {selectedPool.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{participant.name}</p>
                            {participant.userId === selectedPool.createdBy && (
                              <Badge variant="secondary" className="text-xs">Creator</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{selectedPool.currency} {participant.contributionAmount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {participant.contributionAmount > 0 ? 'Contributed' : 'Pending'}
                            </p>
                          </div>
                          {participant.userId !== selectedPool.createdBy && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveParticipant(participant.userId, participant.name)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                    className="w-full"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Invite Person
                  </Button>
                  <Button
                    onClick={() => setShowAddContribution(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contribution
                  </Button>
                </div>

                {/* Contributions History */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Contributions ({selectedPool.contributions.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedPool.contributions.length > 0 ? (
                      selectedPool.contributions.map((contribution, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div>
                            <p className="font-medium">
                              {selectedPool.participants.find(p => p.userId === contribution.userId)?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contribution.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{selectedPool.currency} {contribution.amount.toLocaleString()}</p>
                            <Badge variant={contribution.status === 'confirmed' ? 'default' : 'secondary'}>
                              {contribution.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No contributions yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contribution Dialog */}
      <Dialog open={showAddContribution} onOpenChange={setShowAddContribution}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Record a new contribution for {selectedPool?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contributionParticipant">Who contributed?</Label>
              <Select value={selectedContributorId} onValueChange={setSelectedContributorId}>
                <SelectTrigger id="contributionParticipant">
                  <SelectValue placeholder="Select contributor" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPool?.participants.map((participant) => (
                    <SelectItem key={participant.userId} value={participant.userId}>
                      {participant.name} {participant.email && `(${participant.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Amount</Label>
              <Input
                id="contributionAmount"
                ref={contributionAmountRef}
                type="number"
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contributionNotes">Notes (Optional)</Label>
              <Textarea
                id="contributionNotes"
                ref={contributionNotesRef}
                placeholder="Add any notes about this contribution"
                rows={3}
              />
            </div>

            {selectedPool && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Total</p>
                <p className="text-2xl font-bold">
                  {selectedPool.currency} {selectedPool.collectedAmount.toLocaleString()} / {selectedPool.targetAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddContribution(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContribution}>
              Add Contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Participant Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Participant</DialogTitle>
            <DialogDescription>
              Add a new person to {selectedPool?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Name</Label>
              <Input
                id="inviteName"
                placeholder="Enter participant name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="Enter participant email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            {selectedPool && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Participants</p>
                <p className="text-lg font-bold">
                  {selectedPool.participants.length} people in this pool
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteParticipant}>
              Add Participant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Preview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Split Bills</CardTitle>
            </div>
            <CardDescription>
              Divide shared expenses like rent, utilities, or dinner bills with roommates and friends.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Fundraise</CardTitle>
            </div>
            <CardDescription>
              Collect money for events, gifts, or group activities with transparent tracking.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Group Savings</CardTitle>
            </div>
            <CardDescription>
              Reach shared savings goals together with friends or family members.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">ROSCA</CardTitle>
            </div>
            <CardDescription>
              Traditional rotating savings where members take turns receiving the pot.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How Money Pools Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Create a pool and set a target amount</p>
          <p>• Invite friends via email or share a join code</p>
          <p>• Participants contribute money to reach the goal</p>
          <p>• Track progress and see who contributed what</p>
          <p>• Close the pool when the target is reached</p>
        </CardContent>
      </Card>
    </div>
    </ModuleAccessGuard>
  );
}

