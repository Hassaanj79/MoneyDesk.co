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
  MoreHorizontal, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { AdminUser, ModuleAccess, SubscriptionTier } from '@/types';
import { EnhancedModuleAccess } from './enhanced-module-access';
import { toast } from 'sonner';

export function EnhancedUserManagement() {
  const { users, loading, error, refreshUsers, toggleUser, removeUser, updateUserAccessAndSubscription } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium' | 'enterprise'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      
      // Determine subscription tier from module access
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      const subscriptionTier = hasPremiumFeatures ? 'premium' : 'free';
      
      const matchesSubscription = subscriptionFilter === 'all' || 
        subscriptionTier === subscriptionFilter;
      
      return matchesSearch && matchesStatus && matchesSubscription;
    });
  }, [users, searchTerm, statusFilter, subscriptionFilter]);

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedUsers.map(userId => toggleUser(userId, true)));
          toast.success(`${selectedUsers.length} users activated successfully`);
          break;
        case 'deactivate':
          await Promise.all(selectedUsers.map(userId => toggleUser(userId, false)));
          toast.success(`${selectedUsers.length} users deactivated successfully`);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
            await Promise.all(selectedUsers.map(userId => removeUser(userId)));
            toast.success(`${selectedUsers.length} users deleted successfully`);
          }
          break;
      }
      setSelectedUsers([]);
      setShowBulkActions(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform bulk action');
    }
  };

  const handleUserAction = async (userId: string, action: 'toggle' | 'delete') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      switch (action) {
        case 'toggle':
          await toggleUser(userId, !user.isActive);
          toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
            await removeUser(userId);
            toast.success('User deleted successfully');
          }
          break;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform action');
    }
  };

  const getSubscriptionTier = (moduleAccess: ModuleAccess): SubscriptionTier => {
    if (moduleAccess.loans && moduleAccess.reports && moduleAccess.budgets) {
      return 'enterprise';
    } else if (moduleAccess.loans || moduleAccess.reports || moduleAccess.budgets) {
      return 'premium';
    }
    return 'free';
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

  const getSubscriptionBadge = (tier: SubscriptionTier) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
      premium: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      enterprise: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    };

    return (
      <Badge className={colors[tier]}>
        <Shield className="h-3 w-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastLoginBadge = (lastLoginAt?: string) => {
    if (!lastLoginAt) {
      return (
        <Badge variant="outline" className="text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          Never
        </Badge>
      );
    }

    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Today
        </Badge>
      );
    } else if (diffInDays <= 7) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          {diffInDays}d ago
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {diffInDays}d ago
        </Badge>
      );
    }
  };

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
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
                <User className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, access permissions, and subscriptions
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

              <Select value={subscriptionFilter} onValueChange={(value: any) => setSubscriptionFilter(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
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
                    onClick={() => handleBulkAction('activate')}
                    className="gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
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

      {/* Users Table */}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const subscriptionTier = getSubscriptionTier(user.moduleAccess);
                  const isSelected = selectedUsers.includes(user.id);
                  
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
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'No Name'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(subscriptionTier)}
                      </TableCell>
                      <TableCell>
                        {getLastLoginBadge(user.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EnhancedModuleAccess
                            userId={user.id}
                            userEmail={user.email}
                            userName={user.name || user.email}
                            currentModuleAccess={user.moduleAccess}
                            onUpdate={async (moduleAccess, subscription) => {
                              if (subscription) {
                                await updateUserAccessAndSubscription(
                                  user.id,
                                  moduleAccess,
                                  subscription.tier as SubscriptionTier,
                                  subscription.status as any,
                                  subscription.endDate
                                );
                              } else {
                                // Just update module access
                                await updateUserAccessAndSubscription(
                                  user.id,
                                  moduleAccess,
                                  subscriptionTier,
                                  'active'
                                );
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'toggle')}
                            className="gap-1"
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No users have been created yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {users.filter(u => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Premium Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {users.filter(u => getSubscriptionTier(u.moduleAccess) !== 'free').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Recent Logins</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {users.filter(u => {
                if (!u.lastLoginAt) return false;
                const lastLogin = new Date(u.lastLoginAt);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return lastLogin >= sevenDaysAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
