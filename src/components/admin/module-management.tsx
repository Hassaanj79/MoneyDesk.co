"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Shield, 
  Crown, 
  Lock, 
  Unlock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ModuleAccess } from '@/types';
import { useAdmin } from '@/contexts/admin-context';
import { toast } from 'sonner';

interface ModuleManagementProps {
  userId: string;
  userEmail: string;
  userName: string;
  currentModuleAccess: ModuleAccess;
  userSubscription?: {
    tier: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
  };
}

const moduleInfo = {
  dashboard: {
    name: 'Dashboard',
    description: 'Overview and analytics',
    icon: Shield,
    tier: 'free' as const,
    category: 'Core'
  },
  transactions: {
    name: 'Transactions',
    description: 'Income and expense tracking',
    icon: Shield,
    tier: 'free' as const,
    category: 'Core'
  },
  loans: {
    name: 'Loans',
    description: 'Loan management and tracking',
    icon: Crown,
    tier: 'premium' as const,
    category: 'Advanced'
  },
  reports: {
    name: 'Reports',
    description: 'Advanced analytics and insights',
    icon: Crown,
    tier: 'premium' as const,
    category: 'Advanced'
  },
  settings: {
    name: 'Settings',
    description: 'Account and app configuration',
    icon: Shield,
    tier: 'free' as const,
    category: 'Core'
  },
  accounts: {
    name: 'Accounts',
    description: 'Bank and financial accounts',
    icon: Shield,
    tier: 'free' as const,
    category: 'Core'
  },
  budgets: {
    name: 'Budgets',
    description: 'Budget planning and tracking',
    icon: Crown,
    tier: 'premium' as const,
    category: 'Advanced'
  },
  categories: {
    name: 'Categories',
    description: 'Transaction categorization',
    icon: Shield,
    tier: 'free' as const,
    category: 'Core'
  }
};

const tierPresets = {
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

export function ModuleManagement({ 
  userId, 
  userEmail, 
  userName, 
  currentModuleAccess,
  userSubscription 
}: ModuleManagementProps) {
  const { updateUserAccess } = useAdmin();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess>(currentModuleAccess);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleModuleToggle = (module: keyof ModuleAccess, enabled: boolean) => {
    const newAccess = { ...moduleAccess, [module]: enabled };
    setModuleAccess(newAccess);
    setHasChanges(true);
  };

  const handleTierPreset = (tier: 'free' | 'premium' | 'enterprise') => {
    setModuleAccess(tierPresets[tier]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserAccess(userId, moduleAccess);
      setHasChanges(false);
      toast.success('Module access updated successfully');
    } catch (error) {
      toast.error('Failed to update module access');
      console.error('Error updating module access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setModuleAccess(currentModuleAccess);
    setHasChanges(false);
  };

  const coreModules = Object.entries(moduleInfo).filter(([_, info]) => info.category === 'Core');
  const advancedModules = Object.entries(moduleInfo).filter(([_, info]) => info.category === 'Advanced');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Module Access Control
            </CardTitle>
            <CardDescription>
              Manage module access for {userName} ({userEmail})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {userSubscription && (
              <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>
                {userSubscription.tier.toUpperCase()} - {userSubscription.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTierPreset('free')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Free Plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTierPreset('premium')}
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Premium Plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTierPreset('enterprise')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Enterprise Plan
            </Button>
          </div>
        </div>

        {/* Core Modules */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Core Modules</Label>
          <div className="grid gap-3">
            {coreModules.map(([moduleKey, info]) => {
              const Icon = info.icon;
              const isEnabled = moduleAccess[moduleKey as keyof ModuleAccess];
              
              return (
                <div key={moduleKey} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={info.tier === 'free' ? 'secondary' : 'default'} className="text-xs">
                      {info.tier}
                    </Badge>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleModuleToggle(moduleKey as keyof ModuleAccess, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Modules */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Advanced Modules</Label>
          <div className="grid gap-3">
            {advancedModules.map(([moduleKey, info]) => {
              const Icon = info.icon;
              const isEnabled = moduleAccess[moduleKey as keyof ModuleAccess];
              
              return (
                <div key={moduleKey} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={info.tier === 'free' ? 'secondary' : 'default'} className="text-xs">
                      {info.tier}
                    </Badge>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleModuleToggle(moduleKey as keyof ModuleAccess, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              You have unsaved changes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Access Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Access Summary</Label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Enabled: {Object.values(moduleAccess).filter(Boolean).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Disabled: {Object.values(moduleAccess).filter(v => !v).length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
