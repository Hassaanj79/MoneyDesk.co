"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import type { SubscriptionTier } from '@/types';
import { format } from 'date-fns';

export function SubscriptionManagement() {
  const { users, loading, error, updateSubscription } = useAdmin();
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingSubscription, setEditingSubscription] = useState({
    tier: 'free' as SubscriptionTier,
    status: 'active' as 'active' | 'inactive' | 'cancelled' | 'expired',
    endDate: ''
  });

  // Calculate subscription statistics
  const subscriptionStats = useMemo(() => {
    const stats = {
      total: users.length,
      free: 0,
      premium: 0,
      enterprise: 0,
      active: 0,
      inactive: 0,
      cancelled: 0,
      expired: 0
    };

    users.forEach(user => {
      // This would normally come from actual subscription data
      // For now, we'll simulate based on module access
      if (user.moduleAccess.reports && user.moduleAccess.loans && user.moduleAccess.budgets) {
        stats.enterprise++;
      } else if (user.moduleAccess.reports || user.moduleAccess.loans) {
        stats.premium++;
      } else {
        stats.free++;
      }

      if (user.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    return stats;
  }, [users]);

  const filteredUsers = users.filter(user => {
    const matchesTier = selectedTier === 'all' || 
      (selectedTier === 'free' && !user.moduleAccess.reports && !user.moduleAccess.loans) ||
      (selectedTier === 'premium' && (user.moduleAccess.reports || user.moduleAccess.loans) && !user.moduleAccess.budgets) ||
      (selectedTier === 'enterprise' && user.moduleAccess.reports && user.moduleAccess.loans && user.moduleAccess.budgets);
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive) ||
      (selectedStatus === 'inactive' && !user.isActive);

    return matchesTier && matchesStatus;
  });

  const handleEditSubscription = (user: any) => {
    setSelectedUser(user);
    // Determine current tier based on module access
    let currentTier: SubscriptionTier = 'free';
    if (user.moduleAccess.reports && user.moduleAccess.loans && user.moduleAccess.budgets) {
      currentTier = 'enterprise';
    } else if (user.moduleAccess.reports || user.moduleAccess.loans) {
      currentTier = 'premium';
    }

    setEditingSubscription({
      tier: currentTier,
      status: user.isActive ? 'active' : 'inactive',
      endDate: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedUser) return;

    try {
      await updateSubscription(
        selectedUser.id,
        editingSubscription.tier,
        editingSubscription.status,
        editingSubscription.endDate || undefined
      );
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTierFromModuleAccess = (moduleAccess: any) => {
    if (moduleAccess.reports && moduleAccess.loans && moduleAccess.budgets) {
      return 'enterprise';
    } else if (moduleAccess.reports || moduleAccess.loans) {
      return 'premium';
    } else {
      return 'free';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Loading subscriptions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Tier</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.free}</div>
            <p className="text-xs text-muted-foreground">
              Basic access users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Tier</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.premium}</div>
            <p className="text-xs text-muted-foreground">
              Advanced features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.enterprise}</div>
            <p className="text-xs text-muted-foreground">
              Full access users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Manage user subscriptions and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const tier = getTierFromModuleAccess(user.moduleAccess);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierBadgeColor(tier)}>
                          {tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.isActive ? 'active' : 'inactive')}
                          <span className="text-sm">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.moduleAccess)
                            .filter(([_, hasAccess]) => hasAccess)
                            .map(([module, _]) => (
                              <Badge key={module} variant="outline" className="text-xs">
                                {module}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt 
                          ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubscription(user)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription tier and status for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subscription Tier</label>
              <Select 
                value={editingSubscription.tier} 
                onValueChange={(value: SubscriptionTier) => 
                  setEditingSubscription(prev => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={editingSubscription.status} 
                onValueChange={(value: 'active' | 'inactive' | 'cancelled' | 'expired') => 
                  setEditingSubscription(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">End Date (Optional)</label>
              <Input
                type="date"
                value={editingSubscription.endDate}
                onChange={(e) => setEditingSubscription(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubscription}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

