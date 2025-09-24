"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  Save,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AuthUser } from '@/services/auth-users';
import { toast } from 'sonner';

interface ModuleAccess {
  dashboard: boolean;
  transactions: boolean;
  loans: boolean;
  reports: boolean;
  settings: boolean;
  accounts: boolean;
  budgets: boolean;
  categories: boolean;
}

interface UserEditModalProps {
  user: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: any) => Promise<void>;
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess>({
    dashboard: true,
    transactions: true,
    loans: false,
    reports: false,
    settings: true,
    accounts: true,
    budgets: false,
    categories: true
  });
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'premium' | 'enterprise'>('free');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setIsActive(!user.disabled);
      
      // Set default module access based on subscription tier
      // This would typically come from Firestore user data
      setModuleAccess({
        dashboard: true,
        transactions: true,
        loans: false,
        reports: false,
        settings: true,
        accounts: true,
        budgets: false,
        categories: true
      });
    }
  }, [user]);

  const handleModuleAccessChange = (module: keyof ModuleAccess, enabled: boolean) => {
    setModuleAccess(prev => ({
      ...prev,
      [module]: enabled
    }));
  };

  const handleSubscriptionTierChange = (tier: string) => {
    setSubscriptionTier(tier as 'free' | 'premium' | 'enterprise');
    
    // Auto-set module access based on subscription tier
    switch (tier) {
      case 'free':
        setModuleAccess({
          dashboard: true,
          transactions: true,
          loans: false,
          reports: false,
          settings: true,
          accounts: true,
          budgets: false,
          categories: true
        });
        break;
      case 'premium':
        setModuleAccess({
          dashboard: true,
          transactions: true,
          loans: true,
          reports: true,
          settings: true,
          accounts: true,
          budgets: false,
          categories: true
        });
        break;
      case 'enterprise':
        setModuleAccess({
          dashboard: true,
          transactions: true,
          loans: true,
          reports: true,
          settings: true,
          accounts: true,
          budgets: true,
          categories: true
        });
        break;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const updates = {
        displayName,
        email,
        moduleAccess,
        subscriptionTier,
        isActive
      };

      await onSave(user.uid, updates);
      toast.success('User updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Manage user settings and module access for {user.displayName || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                  <Select value={subscriptionTier} onValueChange={handleSubscriptionTierChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Badge className={getTierBadgeColor(subscriptionTier)}>
                      {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Account Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Module Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(moduleAccess).map(([module, enabled]) => (
                  <div key={module} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{module}</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleModuleAccessChange(module as keyof ModuleAccess, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
