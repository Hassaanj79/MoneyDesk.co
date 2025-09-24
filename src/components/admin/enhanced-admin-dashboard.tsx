"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Activity,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  UserMinus,
  Calendar,
  PieChart,
  LineChart,
  Shield,
  Mail,
  UserX,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { AdminUser, AdminStats } from '@/types';
import { fetchAllAuthUsers, AuthUser } from '@/services/auth-users';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRange } from 'react-day-picker';

interface DashboardMetrics {
  totalUsers: number;
  totalAuthUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  freeUsers: number;
  enterpriseUsers: number;
  recentLogins: number;
  inactiveUsers: number;
  totalTransactions: number;
  totalLoans: number;
  totalAccounts: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalCancellationRequests: number;
  pendingCancellationRequests: number;
  inProgressCancellationRequests: number;
  retainedCancellationRequests: number;
  cancelledCancellationRequests: number;
  newCancellationRequestsToday: number;
  newCancellationRequestsThisWeek: number;
}

interface UserActivity {
  id: string;
  email: string;
  name: string;
  action: 'login' | 'signup' | 'transaction' | 'loan_created';
  timestamp: string;
  details?: string;
}

export function EnhancedAdminDashboard() {
  const { users, stats, cancellationRequests, loading, refreshStats } = useAdmin();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [authUsersLoading, setAuthUsersLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Load Firebase Auth users
  const loadAuthUsers = async () => {
    try {
      setAuthUsersLoading(true);
      const response = await fetchAllAuthUsers();
      setAuthUsers(response.users);
    } catch (error) {
      console.error('Error loading auth users:', error);
    } finally {
      setAuthUsersLoading(false);
    }
  };

  // Load auth users on component mount
  useEffect(() => {
    loadAuthUsers();
  }, []);

  // Calculate metrics from users data
  useEffect(() => {
    if (users.length === 0 && authUsers.length === 0 && cancellationRequests.length === 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Use date range if provided, otherwise use default time periods
    const startDate = dateRange?.from || weekAgo;
    const endDate = dateRange?.to || now;

    // Calculate metrics for Firestore users
    const newUsersToday = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= today;
    }).length;

    const newUsersInRange = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    }).length;

    const newUsersThisWeek = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= weekAgo;
    }).length;

    const newUsersThisMonth = users.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= monthAgo;
    }).length;

    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = users.filter(user => !user.isActive).length;

    // Calculate metrics for Firebase Auth users
    const authNewUsersToday = authUsers.filter(user => {
      const createdAt = new Date(user.metadata.creationTime);
      return createdAt >= today;
    }).length;

    const authNewUsersInRange = authUsers.filter(user => {
      const createdAt = new Date(user.metadata.creationTime);
      return createdAt >= startDate && createdAt <= endDate;
    }).length;

    const authNewUsersThisWeek = authUsers.filter(user => {
      const createdAt = new Date(user.metadata.creationTime);
      return createdAt >= weekAgo;
    }).length;

    const authNewUsersThisMonth = authUsers.filter(user => {
      const createdAt = new Date(user.metadata.creationTime);
      return createdAt >= monthAgo;
    }).length;

    const authActiveUsers = authUsers.filter(user => !user.disabled).length;
    const authInactiveUsers = authUsers.filter(user => user.disabled).length;
    const verifiedUsers = authUsers.filter(user => user.emailVerified).length;
    const unverifiedUsers = authUsers.filter(user => !user.emailVerified).length;

    const premiumUsers = users.filter(user => {
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      return hasPremiumFeatures;
    }).length;

    const freeUsers = users.filter(user => {
      const hasPremiumFeatures = user.moduleAccess.loans || user.moduleAccess.reports || user.moduleAccess.budgets;
      return !hasPremiumFeatures;
    }).length;

    const enterpriseUsers = users.filter(user => {
      return user.moduleAccess.loans && user.moduleAccess.reports && user.moduleAccess.budgets;
    }).length;

    const recentLogins = users.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLogin = new Date(user.lastLoginAt);
      return lastLogin >= sevenDaysAgo;
    }).length;

    const authRecentLogins = authUsers.filter(user => {
      if (!user.metadata.lastSignInTime) return false;
      const lastLogin = new Date(user.metadata.lastSignInTime);
      return lastLogin >= sevenDaysAgo;
    }).length;

    // Calculate cancellation metrics
    const totalCancellationRequests = cancellationRequests.length;
    const pendingCancellationRequests = cancellationRequests.filter(req => req.status === 'NEW').length;
    const inProgressCancellationRequests = cancellationRequests.filter(req => req.status === 'IN_PROGRESS').length;
    const retainedCancellationRequests = cancellationRequests.filter(req => req.status === 'RETAINED').length;
    const cancelledCancellationRequests = cancellationRequests.filter(req => req.status === 'CANCELLED').length;
    
    const newCancellationRequestsToday = cancellationRequests.filter(req => {
      const createdAt = new Date(req.createdAt);
      return createdAt >= today;
    }).length;
    
    const newCancellationRequestsInRange = cancellationRequests.filter(req => {
      const createdAt = new Date(req.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    }).length;
    
    const newCancellationRequestsThisWeek = cancellationRequests.filter(req => {
      const createdAt = new Date(req.createdAt);
      return createdAt >= weekAgo;
    }).length;

    setMetrics({
      totalUsers: users.length,
      totalAuthUsers: authUsers.length,
      activeUsers: activeUsers + authActiveUsers,
      newUsersToday: newUsersToday + authNewUsersToday,
      newUsersThisWeek: newUsersThisWeek + authNewUsersThisWeek,
      newUsersThisMonth: newUsersThisMonth + authNewUsersThisMonth,
      premiumUsers,
      freeUsers,
      enterpriseUsers,
      recentLogins: recentLogins + authRecentLogins,
      inactiveUsers: inactiveUsers + authInactiveUsers,
      totalTransactions: stats?.totalTransactions || 0,
      totalLoans: stats?.totalLoans || 0,
      totalAccounts: stats?.totalAccounts || 0,
      verifiedUsers,
      unverifiedUsers,
      totalCancellationRequests,
      pendingCancellationRequests,
      inProgressCancellationRequests,
      retainedCancellationRequests,
      cancelledCancellationRequests,
      newCancellationRequestsToday,
      newCancellationRequestsThisWeek,
    });
  }, [users, stats, authUsers, cancellationRequests, dateRange]);

  // Generate mock recent activity
  useEffect(() => {
    if (users.length === 0) return;

    const activities: UserActivity[] = [];
    const now = new Date();

    // Generate some mock activities based on users
    users.slice(0, 10).forEach((user, index) => {
      const timeOffset = index * 30 * 60 * 1000; // 30 minutes apart
      const timestamp = new Date(now.getTime() - timeOffset);

      activities.push({
        id: `activity-${index}`,
        email: user.email,
        name: user.name || user.email,
        action: index % 4 === 0 ? 'login' : index % 4 === 1 ? 'transaction' : index % 4 === 2 ? 'loan_created' : 'signup',
        timestamp: timestamp.toISOString(),
        details: index % 4 === 0 ? 'Logged in successfully' : 
                 index % 4 === 1 ? 'Created new transaction' : 
                 index % 4 === 2 ? 'Created new loan' : 'Signed up for account'
      });
    });

    setRecentActivity(activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [users]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'signup':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'transaction':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'loan_created':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (action: string) => {
    const colors = {
      login: 'bg-green-100 text-green-800 border-green-200',
      signup: 'bg-blue-100 text-blue-800 border-blue-200',
      transaction: 'bg-purple-100 text-purple-800 border-purple-200',
      loan_created: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Real-time insights into your MoneyDesk.co platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
            <DateRangePicker 
              date={dateRange} 
              onDateChange={setDateRange}
              className="w-[280px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Firestore Users</p>
                <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+{metrics?.newUsersThisWeek || 0} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auth Users</p>
                <p className="text-2xl font-bold">{metrics?.totalAuthUsers || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics?.verifiedUsers || 0} verified
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics?.activeUsers || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium Users</p>
                <p className="text-2xl font-bold">{metrics?.premiumUsers || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics ? Math.round((metrics.premiumUsers / metrics.totalUsers) * 100) : 0}% conversion
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Logins</p>
                <p className="text-2xl font-bold">{metrics?.recentLogins || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cancellations</p>
                <p className="text-2xl font-bold">{metrics?.totalCancellationRequests || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {dateRange 
                  ? `${newCancellationRequestsInRange} in selected range`
                  : `${metrics?.newCancellationRequestsThisWeek || 0} this week`
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{metrics?.pendingCancellationRequests || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">New requests</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{metrics?.inProgressCancellationRequests || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Being processed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retained</p>
                <p className="text-2xl font-bold">{metrics?.retainedCancellationRequests || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Successfully retained</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>
              New user registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Today</p>
                    <p className="text-sm text-muted-foreground">New registrations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{metrics?.newUsersToday || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">This Week</p>
                    <p className="text-sm text-muted-foreground">New registrations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.newUsersThisWeek || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-sm text-muted-foreground">New registrations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{metrics?.newUsersThisMonth || 0}</p>
                </div>
              </div>

              {dateRange && (
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Selected Range</p>
                      <p className="text-sm text-muted-foreground">
                        {dateRange.from && dateRange.to 
                          ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                          : 'Custom range'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {newUsersInRange + authNewUsersInRange}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of user subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Free Users</p>
                    <p className="text-sm text-muted-foreground">Basic plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{metrics?.freeUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics ? Math.round((metrics.freeUsers / metrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Premium Users</p>
                    <p className="text-sm text-muted-foreground">Advanced features</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.premiumUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics ? Math.round((metrics.premiumUsers / metrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Enterprise Users</p>
                    <p className="text-sm text-muted-foreground">Full access</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{metrics?.enterpriseUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics ? Math.round((metrics.enterpriseUsers / metrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{activity.name}</p>
                    {getActivityBadge(activity.action)}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                </div>
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{metrics?.totalTransactions || 0}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
                <p className="text-2xl font-bold">{metrics?.totalLoans || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{metrics?.totalAccounts || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
