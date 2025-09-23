"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Shield,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { UserManagement } from '@/components/admin/user-management';
import { SubscriptionManagement } from '@/components/admin/subscription-management';
import { CancellationInbox } from '@/components/admin/cancellation-inbox';
import { useAuth } from '@/contexts/auth-context';

// Admin access check - only your credentials allowed
const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Only your specific email is allowed
  const adminEmails = [
    'hassyku786@gmail.com',
    // Add your other email if needed
  ];
  
  return adminEmails.includes(email.toLowerCase());
};

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user has admin access - only your credentials allowed
  if (!isAdminUser(user?.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              Only authorized administrators can access this panel.
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Current user: {user?.email || 'Not logged in'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Authorized administrators:</p>
              <p className="font-mono text-xs">hassyku786@gmail.com</p>
            </div>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and statistics'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      description: 'Manage user accounts'
    },
    {
      id: 'cancellations',
      label: 'Cancellations',
      icon: Mail,
      description: 'User cancellation requests'
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: CreditCard,
      description: 'Manage subscriptions and billing'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Admin Panel</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                  Manage users, subscriptions, and system settings
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                  <span>Logged in as:</span>
                  <span className="font-mono text-primary font-semibold bg-primary/10 px-2 py-1 rounded">{user?.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 px-4 py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Access
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-3 p-6 transition-all duration-200 border-b-2 ${
                      isActive 
                        ? 'bg-primary text-white border-primary' 
                        : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {tab.label}
                      </div>
                      <div className={`text-xs mt-1 hidden sm:block ${
                        isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="cancellations" className="space-y-6">
            <CancellationInbox />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Maintenance Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable user access for maintenance
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure system email settings
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Backup & Recovery</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage data backups and recovery options
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
