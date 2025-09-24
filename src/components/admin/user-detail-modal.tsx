"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Key,
  Smartphone,
  Globe
} from 'lucide-react';
import { AuthUser, getUserStatus, formatAuthDate } from '@/services/auth-users';

interface UserDetailModalProps {
  user: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
}

export function UserDetailModal({ 
  user, 
  isOpen, 
  onClose, 
  onEdit, 
  onResetPassword, 
  onToggleStatus 
}: UserDetailModalProps) {
  if (!user) return null;

  const status = getUserStatus(user);

  const getStatusBadge = () => {
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

  const getEmailVerifiedBadge = () => {
    return user.emailVerified ? (
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {user.displayName || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.displayName || 'No Name'}</h3>
                  <p className="text-muted-foreground">{user.email || 'No Email'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {user.uid}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Verification</label>
                  <div className="mt-1">
                    {getEmailVerifiedBadge()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                  <div className="mt-1">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.providerData.map((provider, index) => (
                  <div key={index}>
                    {getProviderBadge(provider.providerId)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Account Created
                  </label>
                  <p className="text-sm mt-1">
                    {formatAuthDate(user.metadata.creationTime)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Last Sign-in
                  </label>
                  <p className="text-sm mt-1">
                    {user.metadata.lastSignInTime 
                      ? formatAuthDate(user.metadata.lastSignInTime)
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button onClick={onEdit} className="gap-2">
              <Shield className="h-4 w-4" />
              Edit User
            </Button>
            <Button variant="outline" onClick={onResetPassword} className="gap-2">
              <Key className="h-4 w-4" />
              Reset Password
            </Button>
            <Button 
              variant={user.disabled ? "default" : "destructive"} 
              onClick={onToggleStatus}
              className="gap-2"
            >
              {user.disabled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enable User
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Disable User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
