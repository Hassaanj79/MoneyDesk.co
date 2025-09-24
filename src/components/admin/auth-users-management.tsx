"use client";

import React, { useState, useEffect } from 'react';
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
  Search, 
  Filter, 
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
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Ban,
  Unlock
} from 'lucide-react';
import { fetchAllAuthUsers, AuthUser, getUserStatus, getLastSignInBadge, formatAuthDate } from '@/services/auth-users';
import { UserDetailModal } from './user-detail-modal';
import { UserEditModal } from './user-edit-modal';
import { toast } from 'sonner';

export function AuthUsersManagement() {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'disabled'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter users
  const filteredUsers = authUsers.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userStatus = getUserStatus(user);
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
    const matchesVerified = verifiedFilter === 'all' || 
      (verifiedFilter === 'verified' && user.emailVerified) ||
      (verifiedFilter === 'unverified' && !user.emailVerified);
    
    return matchesSearch && matchesStatus && matchesVerified;
  });

  const loadAuthUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllAuthUsers();
      setAuthUsers(response.users);
      console.log('Loaded auth users:', response.users.length);
      
      // Show a subtle notification if using fallback data
      if (response.users.some(user => user.uid.startsWith('fallback-'))) {
        toast.info('Using demo authentication data. Configure Firebase Admin SDK for real user data.');
      }
    } catch (err: any) {
      // The service now returns fallback data instead of throwing, so this should rarely happen
      setError(err.message || 'Failed to load authentication users');
      console.error('Error loading auth users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthUsers();
  }, []);

  const handleViewUser = (user: AuthUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user: AuthUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleResetPassword = async (user: AuthUser) => {
    try {
      const response = await fetch('/api/admin/users/firebase-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Password reset email sent to ${user.email}`);
      } else {
        toast.error(result.error || 'Failed to send password reset email');
      }
    } catch (error: any) {
      toast.error('Failed to send password reset email');
      console.error('Error sending password reset:', error);
    }
  };

  const handleToggleUserStatus = async (user: AuthUser) => {
    try {
      const newDisabledStatus = !user.disabled;
      
      const response = await fetch('/api/admin/users/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          disabled: newDisabledStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`User ${newDisabledStatus ? 'disabled' : 'enabled'} successfully`);
        // Update the user in the local state
        setAuthUsers(prev => prev.map(u => 
          u.uid === user.uid ? { ...u, disabled: newDisabledStatus } : u
        ));
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (error: any) {
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
    }
  };

  const handleSaveUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the user in the local state
        setAuthUsers(prev => prev.map(u => 
          u.uid === userId ? { ...u, ...updates } : u
        ));
        return result;
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const getStatusBadge = (user: AuthUser) => {
    const status = getUserStatus(user);
    
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'disabled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Disabled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getEmailVerifiedBadge = (emailVerified: boolean) => {
    return emailVerified ? (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  const getLastSignInDisplay = (user: AuthUser) => {
    const badge = getLastSignInBadge(user.metadata.lastSignInTime);
    const IconComponent = badge.icon === 'CheckCircle' ? CheckCircle : 
                         badge.icon === 'Clock' ? Clock :
                         badge.icon === 'AlertTriangle' ? AlertTriangle : XCircle;
    
    return (
      <Badge className={badge.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {badge.text}
      </Badge>
    );
  };

  const getProviderBadge = (providerId: string) => {
    const colors = {
      'password': 'bg-gray-100 text-gray-800 border-gray-200',
      'google.com': 'bg-red-100 text-red-800 border-red-200',
      'facebook.com': 'bg-blue-100 text-blue-800 border-blue-200',
      'twitter.com': 'bg-sky-100 text-sky-800 border-sky-200',
      'github.com': 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge className={colors[providerId as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {providerId === 'password' ? 'Email' : providerId.split('.')[0]}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: authUsers.length,
    active: authUsers.filter(user => getUserStatus(user) === 'active').length,
    inactive: authUsers.filter(user => getUserStatus(user) === 'inactive').length,
    disabled: authUsers.filter(user => getUserStatus(user) === 'disabled').length,
    verified: authUsers.filter(user => user.emailVerified).length,
    unverified: authUsers.filter(user => !user.emailVerified).length,
    recentSignIns: authUsers.filter(user => {
      if (!user.metadata.lastSignInTime) return false;
      const lastSignIn = new Date(user.metadata.lastSignInTime);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastSignIn >= sevenDaysAgo;
    }).length,
  };

  if (loading && authUsers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading authentication users...</p>
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
                <Users className="h-5 w-5" />
                Authentication Users
              </CardTitle>
              <CardDescription>
                All users from Firebase Authentication
                {authUsers.some(user => user.uid.startsWith('fallback-')) && (
                  <span className="ml-2 text-orange-600 font-medium">
                    (Demo Data - Configure Firebase Admin SDK for real data)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAuthUsers}
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Sign-ins</p>
                <p className="text-2xl font-bold text-orange-600">{stats.recentSignIns}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email, name, or UID..."
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
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verifiedFilter} onValueChange={(value: any) => setVerifiedFilter(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Last Sign-in</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.displayName || 'No Name'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email || 'No Email'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.uid}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      {getEmailVerifiedBadge(user.emailVerified)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.providerData.map((provider, index) => (
                          <div key={index}>
                            {getProviderBadge(provider.providerId)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getLastSignInDisplay(user)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatAuthDate(user.metadata.creationTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        {user.disabled ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-green-600 hover:text-green-700"
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            <Unlock className="h-4 w-4" />
                            Enable
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700"
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            <Ban className="h-4 w-4" />
                            Disable
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || verifiedFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No authentication users found'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
        onResetPassword={() => {
          if (selectedUser) {
            handleResetPassword(selectedUser);
            setShowDetailModal(false);
            setSelectedUser(null);
          }
        }}
        onToggleStatus={() => {
          if (selectedUser) {
            handleToggleUserStatus(selectedUser);
            setShowDetailModal(false);
            setSelectedUser(null);
          }
        }}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}
