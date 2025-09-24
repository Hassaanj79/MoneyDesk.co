"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalCancellations: number;
  pendingCancellations: number;
  completedCancellations: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

export function FallbackAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalCancellations: 0,
    pendingCancellations: 0,
    completedCancellations: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users from Firestore
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);
        
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch cancellation requests
        const cancellationsQuery = query(collection(db, 'cancellationRequests'), orderBy('createdAt', 'desc'));
        const cancellationsSnapshot = await getDocs(cancellationsQuery);
        
        const cancellations = cancellationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const newUsersToday = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= today;
        }).length;

        const newUsersThisWeek = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= weekAgo;
        }).length;

        const activeUsers = users.filter(user => user.isActive !== false).length;
        const inactiveUsers = users.filter(user => user.isActive === false).length;

        const pendingCancellations = cancellations.filter(req => 
          req.status === 'NEW' || req.status === 'IN_PROGRESS'
        ).length;

        const completedCancellations = cancellations.filter(req => 
          req.status === 'CANCELLED' || req.status === 'RETAINED'
        ).length;

        setStats({
          totalUsers: users.length,
          activeUsers,
          inactiveUsers,
          totalCancellations: cancellations.length,
          pendingCancellations,
          completedCancellations,
          newUsersToday,
          newUsersThisWeek,
        });

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Disabled accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newUsersThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsersToday} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCancellations}</div>
            <p className="text-xs text-muted-foreground">
              All time requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCancellations}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedCancellations}</div>
            <p className="text-xs text-muted-foreground">
              Processed requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">Firestore Database</h4>
                  <p className="text-sm text-muted-foreground">Connected and operational</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">Firebase Admin SDK</h4>
                  <p className="text-sm text-muted-foreground">Using fallback mode</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">Authentication</h4>
                  <p className="text-sm text-muted-foreground">Firebase Auth operational</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
