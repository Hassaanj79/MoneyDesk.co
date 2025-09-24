"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import type { AdminUser } from '@/types';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchAllAuthUsers, AuthUser } from '@/services/auth-users';

export function UserSearch() {
  const { searchUserByEmail, loading, error } = useAdmin();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<AdminUser | AuthUser | null>(null);
  const [searchResultType, setSearchResultType] = useState<'firestore' | 'auth' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchError('Please enter an email address');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    setSearchResultType(null);

    try {
      const email = searchEmail.trim().toLowerCase();
      
      // First, try to search in Firestore users
      const firestoreResult = await searchUserByEmail(email);
      if (firestoreResult) {
        setSearchResult(firestoreResult);
        setSearchResultType('firestore');
        return;
      }

      // If not found in Firestore, search in Firebase Auth users
      const authUsersResponse = await fetchAllAuthUsers();
      const authUser = authUsersResponse.users.find(user => 
        user.email?.toLowerCase() === email
      );

      if (authUser) {
        setSearchResult(authUser);
        setSearchResultType('auth');
      } else {
        setSearchError('No user found with this email address in either Firestore or Firebase Authentication');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Failed to search for user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getTierFromModuleAccess = (moduleAccess: any) => {
    if (moduleAccess.reports && moduleAccess.loans && moduleAccess.budgets) {
      return 'enterprise';
    } else if (moduleAccess.reports || moduleAccess.loans) {
      return 'premium';
    } else {
      return 'free';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Helper functions to get user data regardless of type
  const getUserName = (user: AdminUser | AuthUser) => {
    if ('name' in user) return user.name || 'No name provided';
    return user.displayName || 'No name provided';
  };

  const getUserEmail = (user: AdminUser | AuthUser) => {
    return user.email || 'No email provided';
  };

  const getUserRole = (user: AdminUser | AuthUser) => {
    if ('role' in user) return user.role;
    return 'user';
  };

  const getUserStatus = (user: AdminUser | AuthUser) => {
    if ('isActive' in user) return user.isActive;
    if ('disabled' in user) return !user.disabled;
    return true;
  };

  const getUserCreatedAt = (user: AdminUser | AuthUser) => {
    if ('createdAt' in user) return user.createdAt;
    if ('metadata' in user) return user.metadata.creationTime;
    return new Date().toISOString();
  };

  const getUserLastLogin = (user: AdminUser | AuthUser) => {
    if ('lastLoginAt' in user) return user.lastLoginAt;
    if ('metadata' in user) return user.metadata.lastSignInTime;
    return null;
  };

  const getUserModuleAccess = (user: AdminUser | AuthUser) => {
    if ('moduleAccess' in user) return user.moduleAccess;
    // Default module access for auth users
    return {
      dashboard: true,
      transactions: true,
      loans: false,
      reports: false,
      settings: true,
      accounts: true,
      budgets: false,
      categories: true
    };
  };

  const getUserEmailVerified = (user: AdminUser | AuthUser) => {
    if ('emailVerified' in user) return user.emailVerified;
    return true; // Assume verified for Firestore users
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Search
          </CardTitle>
          <CardDescription>
            Search for a user by email address to view their information, plan, and module access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter user email address..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchEmail.trim()}
              className="px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResult && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  User Found
                  <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {searchResultType === 'firestore' ? 'Firestore User' : 'Auth User'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Name:</span>
                    </div>
                    <p className="text-lg font-semibold">{getUserName(searchResult)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email:</span>
                    </div>
                    <p className="text-lg font-semibold">{getUserEmail(searchResult)}</p>
                  </div>
                </div>

                {/* User Status and Role */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Role:</span>
                    </div>
                    <Badge className={getRoleBadgeColor(getUserRole(searchResult))}>
                      {getUserRole(searchResult)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status:</span>
                    </div>
                    <Badge className={getStatusBadgeColor(getUserStatus(searchResult))}>
                      {getUserStatus(searchResult) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email Verified:</span>
                    </div>
                    <Badge className={getUserEmailVerified(searchResult) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}>
                      {getUserEmailVerified(searchResult) ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Plan:</span>
                    </div>
                    <Badge className={getTierBadgeColor(getTierFromModuleAccess(getUserModuleAccess(searchResult)))}>
                      {getTierFromModuleAccess(getUserModuleAccess(searchResult))}
                    </Badge>
                  </div>
                </div>

                {/* Account Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Account Created:</span>
                    </div>
                    <p className="text-sm">
                      {format(new Date(getUserCreatedAt(searchResult)), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Last Login:</span>
                    </div>
                    <p className="text-sm">
                      {getUserLastLogin(searchResult) 
                        ? format(new Date(getUserLastLogin(searchResult)!), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                {/* Module Access */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Module Access:</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(getUserModuleAccess(searchResult)).map(([module, hasAccess]) => (
                      <div key={module} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm ${hasAccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">User ID:</span>
                  <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {'id' in searchResult ? searchResult.id : searchResult.uid}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
