"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  Star,
  Zap,
  Download,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { AdminUser, ModuleAccess, SubscriptionTier } from '@/types';
import { toast } from 'sonner';

interface SubscriptionAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  conversionRate: number;
  freeToPaidConversion: number;
}

export function EnhancedSubscriptionManagement() {
  const { users, loading, error, refreshUsers, updateUserAccessAndSubscription } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium' | 'enterprise'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'cancelled' | 'expired'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Calculate subscription analytics
  const analytics = useMemo((): SubscriptionAnalytics => {
    const totalUsers = users.length;
    const freeUsers = users.filter(user => {
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      return !hasPremiumFeatures;
    }).length;
    
    const premiumUsers = users.filter(user => {
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      return hasPremiumFeatures;
    }).length;

    // Mock pricing (in real app, this would come from your pricing configuration)
    const freePrice = 0;
    const premiumPrice = 9.99;
    const enterprisePrice = 29.99;

    const totalRevenue = (premiumUsers * premiumPrice) + (premiumUsers * enterprisePrice);
    const monthlyRecurringRevenue = totalRevenue;
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const churnRate = 5.2; // Mock churn rate
    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
    const freeToPaidConversion = freeUsers > 0 ? (premiumUsers / freeUsers) * 100 : 0;

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerUser,
      churnRate,
      conversionRate,
      freeToPaidConversion
    };
  }, [users]);

  // Filter users by subscription
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Determine subscription tier from module access
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      const subscriptionTier = hasPremiumFeatures ? 'premium' : 'free';
      
      const matchesTier = tierFilter === 'all' || subscriptionTier === tierFilter;
      const matchesStatus = statusFilter === 'all' || user.isActive === (statusFilter === 'active');
      
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [users, searchTerm, tierFilter, statusFilter]);

  const getSubscriptionTier = (moduleAccess: ModuleAccess): SubscriptionTier => {
    if (moduleAccess.loans && moduleAccess.reports && moduleAccess.budgets) {
      return 'enterprise';
    } else if (moduleAccess.loans || moduleAccess.reports || moduleAccess.budgets) {
      return 'premium';
    }
    return 'free';
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return <Star className="h-4 w-4" />;
      case 'premium':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Zap className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
      premium: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      enterprise: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    };

    return (
      <Badge className={colors[tier]}>
        {getTierIcon(tier)}
        <span className="ml-1">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const handleBulkUpgrade = async (targetTier: SubscriptionTier) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      const tierFeatures: { [key in SubscriptionTier]: ModuleAccess } = {
        free: {
          dashboard: true,
          transactions: true,
          loans: false,
          reports: false,
          settings: true,
          accounts: true,
          budgets: false,
          categories: true
        },
        premium: {
          dashboard: true,
          transactions: true,
          loans: true,
          reports: true,
          settings: true,
          accounts: true,
          budgets: true,
          categories: true
        },
        enterprise: {
          dashboard: true,
          transactions: true,
          loans: true,
          reports: true,
          settings: true,
          accounts: true,
          budgets: true,
          categories: true
        }
      };

      await Promise.all(selectedUsers.map(userId => 
        updateUserAccessAndSubscription(
          userId,
          tierFeatures[targetTier],
          targetTier,
          'active'
        )
      ));

      toast.success(`${selectedUsers.length} users upgraded to ${targetTier} successfully`);
      setSelectedUsers([]);
      setShowBulkActions(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upgrade users');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading subscriptions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage user subscriptions, billing, and revenue analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUsers}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.monthlyRecurringRevenue)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+8.2% growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ARPU</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.averageRevenuePerUser)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Per user per month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
              </div>
              <PieChart className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Free to paid</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of users by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['free', 'premium', 'enterprise'].map(tier => {
                const tierUsers = users.filter(user => getSubscriptionTier(user.moduleAccess) === tier);
                const percentage = users.length > 0 ? (tierUsers.length / users.length) * 100 : 0;
                
                return (
                  <div key={tier} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTierIcon(tier as SubscriptionTier)}
                      <div>
                        <p className="font-medium capitalize">{tier} Plan</p>
                        <p className="text-sm text-muted-foreground">{tierUsers.length} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Revenue Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Growth Rate</p>
                    <p className="text-sm text-muted-foreground">Monthly growth</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">+12.5%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Churn Rate</p>
                    <p className="text-sm text-muted-foreground">Monthly churn</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{analytics.churnRate}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Conversion Rate</p>
                    <p className="text-sm text-muted-foreground">Free to paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{analytics.freeToPaidConversion.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkUpgrade('premium')}
                    className="gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkUpgrade('enterprise')}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade to Enterprise
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUsers([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const subscriptionTier = getSubscriptionTier(user.moduleAccess);
                  const isSelected = selectedUsers.includes(user.id);
                  const monthlyRevenue = subscriptionTier === 'premium' ? 9.99 : subscriptionTier === 'enterprise' ? 29.99 : 0;
                  
                  return (
                    <TableRow key={user.id} className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {getTierIcon(subscriptionTier)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'No Name'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTierBadge(subscriptionTier)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(monthlyRevenue)}</div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Handle individual upgrade
                              const targetTier = subscriptionTier === 'free' ? 'premium' : 'enterprise';
                              handleBulkUpgrade(targetTier);
                            }}
                            className="gap-1"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Upgrade
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || tierFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No users have subscriptions yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
