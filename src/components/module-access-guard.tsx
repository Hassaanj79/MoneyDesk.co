"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { 
  Lock, 
  Crown, 
  Mail, 
  ArrowUp,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { ModuleAccess } from '@/types';

interface ModuleAccessGuardProps {
  children: React.ReactNode;
  module: keyof ModuleAccess;
  userModuleAccess: ModuleAccess;
  userSubscription?: {
    tier: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
  };
  className?: string;
}

const moduleInfo = {
  dashboard: {
    name: 'Dashboard',
    description: 'Overview and analytics',
    icon: Shield,
    requiredTier: 'free' as const
  },
  transactions: {
    name: 'Transactions',
    description: 'Income and expense tracking',
    icon: ArrowUp,
    requiredTier: 'free' as const
  },
  loans: {
    name: 'Loans',
    description: 'Loan management and tracking',
    icon: Crown,
    requiredTier: 'free' as const
  },
  reports: {
    name: 'Reports',
    description: 'Advanced analytics and insights',
    icon: Shield,
    requiredTier: 'free' as const
  },
  settings: {
    name: 'Settings',
    description: 'Account and app configuration',
    icon: Shield,
    requiredTier: 'free' as const
  },
  accounts: {
    name: 'Accounts',
    description: 'Bank and financial accounts',
    icon: Shield,
    requiredTier: 'free' as const
  },
  budgets: {
    name: 'Budgets',
    description: 'Budget planning and tracking',
    icon: Crown,
    requiredTier: 'free' as const
  },
  categories: {
    name: 'Categories',
    description: 'Transaction categorization',
    icon: Shield,
    requiredTier: 'free' as const
  }
};

export function ModuleAccessGuard({ 
  children, 
  module, 
  userModuleAccess, 
  userSubscription,
  className = ""
}: ModuleAccessGuardProps) {
  const { user } = useAuth();
  
  // Give full access to admin account (hassyku786@gmail.com)
  const isAdmin = user?.email === 'hassyku786@gmail.com';
  const hasAccess = isAdmin || userModuleAccess[module];
  const moduleData = moduleInfo[module];
  const Icon = moduleData.icon;

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  const getUpgradeMessage = () => {
    const tier = userSubscription?.tier || 'free';
    const status = userSubscription?.status || 'inactive';
    
    if (status !== 'active') {
      return {
        title: 'Subscription Required',
        message: 'Your subscription is not active. Please contact support to reactivate your account.',
        action: 'Contact Support',
        actionType: 'support' as const
      };
    }

    if (moduleData.requiredTier === 'premium' && tier === 'free') {
      return {
        title: 'Upgrade to Premium',
        message: 'This feature is available with our Premium plan. Upgrade now to unlock advanced features.',
        action: 'Upgrade Now',
        actionType: 'upgrade' as const
      };
    }

    if (moduleData.requiredTier === 'enterprise' && tier !== 'enterprise') {
      return {
        title: 'Enterprise Feature',
        message: 'This feature is available with our Enterprise plan. Contact us for custom solutions.',
        action: 'Contact Sales',
        actionType: 'enterprise' as const
      };
    }

    return {
      title: 'Access Restricted',
      message: 'This module has been restricted by your administrator. Please contact support for assistance.',
      action: 'Contact Support',
      actionType: 'support' as const
    };
  };

  const upgradeInfo = getUpgradeMessage();

  const handleAction = () => {
    if (upgradeInfo.actionType === 'support') {
      window.open('mailto:support@moneydesk.co?subject=Module Access Request', '_blank');
    } else if (upgradeInfo.actionType === 'upgrade') {
      // Navigate to upgrade page or open upgrade modal
      window.location.href = '/settings?tab=subscription';
    } else if (upgradeInfo.actionType === 'enterprise') {
      window.open('mailto:sales@moneydesk.co?subject=Enterprise Plan Inquiry', '_blank');
    }
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {upgradeInfo.title}
          </CardTitle>
          <CardDescription className="text-base">
            {moduleData.name} - {moduleData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {upgradeInfo.message}
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Access Restricted
            </Badge>
          </div>

          <Button 
            onClick={handleAction}
            className="w-full"
            variant={upgradeInfo.actionType === 'upgrade' ? 'default' : 'outline'}
          >
            {upgradeInfo.actionType === 'upgrade' && <Crown className="h-4 w-4 mr-2" />}
            {upgradeInfo.actionType === 'support' && <Mail className="h-4 w-4 mr-2" />}
            {upgradeInfo.actionType === 'enterprise' && <Shield className="h-4 w-4 mr-2" />}
            {upgradeInfo.action}
          </Button>

          <div className="text-xs text-muted-foreground">
            Need help? Contact us at{' '}
            <a 
              href="mailto:support@moneydesk.co" 
              className="text-primary hover:underline"
            >
              support@moneydesk.co
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check module access
export function useModuleAccess(module: keyof ModuleAccess) {
  // This would typically come from a context or hook
  // For now, we'll return a mock implementation
  return {
    hasAccess: true, // This should be determined by user's module access
    isLoading: false
  };
}
