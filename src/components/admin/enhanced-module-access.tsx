"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Settings, 
  Users, 
  CreditCard, 
  BarChart3, 
  PiggyBank, 
  FileText, 
  Home,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { ModuleAccess, SubscriptionTier } from '@/types';
import { toast } from 'sonner';

interface EnhancedModuleAccessProps {
  userId: string;
  userEmail: string;
  userName: string;
  currentModuleAccess: ModuleAccess;
  currentSubscription?: {
    tier: SubscriptionTier;
    status: string;
    endDate?: string;
  };
  onUpdate: (moduleAccess: ModuleAccess, subscription?: { tier: SubscriptionTier; status: string; endDate?: string }) => Promise<void>;
}

const moduleDefinitions = [
  {
    key: 'dashboard' as keyof ModuleAccess,
    name: 'Dashboard',
    description: 'Access to main dashboard and overview',
    icon: Home,
    category: 'Core',
    required: true
  },
  {
    key: 'transactions' as keyof ModuleAccess,
    name: 'Transactions',
    description: 'Create, view, and manage financial transactions',
    icon: CreditCard,
    category: 'Core',
    required: true
  },
  {
    key: 'accounts' as keyof ModuleAccess,
    name: 'Accounts',
    description: 'Manage bank accounts and financial accounts',
    icon: PiggyBank,
    category: 'Core',
    required: true
  },
  {
    key: 'categories' as keyof ModuleAccess,
    name: 'Categories',
    description: 'Organize transactions with custom categories',
    icon: FileText,
    category: 'Core',
    required: true
  },
  {
    key: 'settings' as keyof ModuleAccess,
    name: 'Settings',
    description: 'Access to user settings and preferences',
    icon: Settings,
    category: 'Core',
    required: true
  },
  {
    key: 'loans' as keyof ModuleAccess,
    name: 'Loans',
    description: 'Track and manage loans and debt',
    icon: BarChart3,
    category: 'Premium',
    required: false
  },
  {
    key: 'pools' as keyof ModuleAccess,
    name: 'Money Pools',
    description: 'Create and manage collaborative money pools',
    icon: PiggyBank,
    category: 'Premium',
    required: false
  },
  {
    key: 'budgets' as keyof ModuleAccess,
    name: 'Budgets',
    description: 'Create and monitor spending budgets',
    icon: BarChart3,
    category: 'Premium',
    required: false
  },
  {
    key: 'reports' as keyof ModuleAccess,
    name: 'Reports',
    description: 'Generate detailed financial reports',
    icon: BarChart3,
    category: 'Premium',
    required: false
  }
];

const subscriptionTiers: { value: SubscriptionTier; label: string; description: string; color: string }[] = [
  {
    value: 'free',
    label: 'Free',
    description: 'Basic features for personal use',
    color: 'bg-gray-100 text-gray-800'
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Advanced features and analytics',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Full access with priority support',
    color: 'bg-purple-100 text-purple-800'
  }
];

const subscriptionStatuses = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-800' }
];

export function EnhancedModuleAccess({ 
  userId, 
  userEmail, 
  userName, 
  currentModuleAccess, 
  currentSubscription,
  onUpdate 
}: EnhancedModuleAccessProps) {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess>(currentModuleAccess);
  const [subscription, setSubscription] = useState({
    tier: currentSubscription?.tier || 'free' as SubscriptionTier,
    status: currentSubscription?.status || 'active',
    endDate: currentSubscription?.endDate || ''
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are changes
  React.useEffect(() => {
    const moduleChanged = Object.keys(moduleAccess).some(key => 
      moduleAccess[key as keyof ModuleAccess] !== currentModuleAccess[key as keyof ModuleAccess]
    );
    const subscriptionChanged = 
      subscription.tier !== (currentSubscription?.tier || 'free') ||
      subscription.status !== (currentSubscription?.status || 'active') ||
      subscription.endDate !== (currentSubscription?.endDate || '');
    
    setHasChanges(moduleChanged || subscriptionChanged);
  }, [moduleAccess, subscription, currentModuleAccess, currentSubscription]);

  const handleModuleToggle = (moduleKey: keyof ModuleAccess, enabled: boolean) => {
    const module = moduleDefinitions.find(m => m.key === moduleKey);
    if (module?.required && !enabled) {
      toast.error(`${module.name} is a required module and cannot be disabled`);
      return;
    }
    
    setModuleAccess(prev => ({
      ...prev,
      [moduleKey]: enabled
    }));
  };

  const applySubscriptionTemplate = (tier: SubscriptionTier) => {
    const templates: { [key in SubscriptionTier]: ModuleAccess } = {
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

    setModuleAccess(templates[tier]);
    setSubscription(prev => ({ ...prev, tier }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(moduleAccess, subscription);
      toast.success('User access updated successfully');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user access');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setModuleAccess(currentModuleAccess);
    setSubscription({
      tier: currentSubscription?.tier || 'free',
      status: currentSubscription?.status || 'active',
      endDate: currentSubscription?.endDate || ''
    });
  };

  const groupedModules = moduleDefinitions.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof moduleDefinitions>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Module Access Management
          </DialogTitle>
          <DialogDescription>
            Manage module access and subscription for {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription Management</CardTitle>
              <CardDescription>
                Update user's subscription tier and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Tier</label>
                  <Select value={subscription.tier} onValueChange={(value: SubscriptionTier) => applySubscriptionTemplate(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionTiers.map(tier => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={tier.color}>{tier.label}</Badge>
                            <span className="text-sm text-muted-foreground">{tier.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={subscription.status} onValueChange={(value) => setSubscription(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          <Badge className={status.color}>{status.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <input
                    type="date"
                    value={subscription.endDate}
                    onChange={(e) => setSubscription(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Access Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Module Access Control</CardTitle>
              <CardDescription>
                Enable or disable specific modules for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedModules).map(([category, modules]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-lg">{category} Modules</h4>
                    <Badge variant="outline">{modules.length} modules</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map(module => {
                      const Icon = module.icon;
                      const isEnabled = moduleAccess[module.key];
                      const isRequired = module.required;
                      
                      return (
                        <div
                          key={module.key}
                          className={`p-4 border rounded-lg transition-all ${
                            isEnabled 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                isEnabled 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{module.name}</h5>
                                  {isRequired && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(enabled) => handleModuleToggle(module.key, enabled)}
                              disabled={isRequired}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {Object.keys(groupedModules).indexOf(category) < Object.keys(groupedModules).length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || loading}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className="gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
