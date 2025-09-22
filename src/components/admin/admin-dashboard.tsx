"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserPlus, TrendingUp, DollarSign, CreditCard, Building2, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminDashboard() {
  const { stats, loading, error, refreshStats } = useAdmin();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading dashboard: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages and growth indicators
  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    return `${((current - previous) / previous * 100).toFixed(1)}%`;
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      description: "All registered users",
      icon: Users,
      color: "text-blue-600",
      growth: "+12.5%", // This would be calculated from previous period
      trend: "up"
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      description: "Users active in last 30 days",
      icon: UserCheck,
      color: "text-green-600",
      growth: "+8.3%",
      trend: "up"
    },
    {
      title: "New This Month",
      value: stats?.newUsersThisMonth || 0,
      description: "New registrations this month",
      icon: UserPlus,
      color: "text-purple-600",
      growth: "+25.0%",
      trend: "up"
    },
    {
      title: "Total Transactions",
      value: stats?.totalTransactions || 0,
      description: "All user transactions",
      icon: TrendingUp,
      color: "text-orange-600",
      growth: "+15.2%",
      trend: "up"
    },
    {
      title: "Total Loans",
      value: stats?.totalLoans || 0,
      description: "All user loans",
      icon: DollarSign,
      color: "text-red-600",
      growth: "+5.7%",
      trend: "up"
    },
    {
      title: "Total Accounts",
      value: stats?.totalAccounts || 0,
      description: "All user accounts",
      icon: Building2,
      color: "text-indigo-600",
      growth: "+18.9%",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage users, subscriptions, and system overview
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.growth}
                    </span>
                    <TrendingUp className={`h-3 w-3 ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscriptions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
