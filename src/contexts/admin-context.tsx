"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getAdminStats, 
  getAllUsers, 
  updateUserModuleAccess, 
  updateUserSubscription, 
  toggleUserStatus, 
  deleteUser
} from '@/services/admin';
import type { AdminUser, AdminStats, ModuleAccess, SubscriptionTier, UserSubscription } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminContextType {
  // State
  users: AdminUser[];
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  
  // Actions
  refreshUsers: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateUserAccess: (userId: string, moduleAccess: ModuleAccess) => Promise<void>;
  updateSubscription: (userId: string, tier: SubscriptionTier, status: 'active' | 'inactive' | 'cancelled' | 'expired', endDate?: string, customModuleAccess?: ModuleAccess) => Promise<void>;
  updateUserAccessAndSubscription: (userId: string, moduleAccess: ModuleAccess, tier: SubscriptionTier, status: 'active' | 'inactive' | 'cancelled' | 'expired', endDate?: string) => Promise<void>;
  toggleUser: (userId: string, isActive: boolean) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.email) {
      const adminEmails = ['hassyku786@gmail.com', 'HASSYKU786@GMAIL.COM', 'Hassyku786@gmail.com'];
      setIsAdmin(adminEmails.includes(user.email));
    } else {
      setIsAdmin(false);
    }
  }, [user?.email]);

  const refreshUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('refreshUsers called, user:', user);
      console.log('User email:', user?.email);
      console.log('User UID:', user?.uid);
      
      if (!user?.email) {
        console.log('No user email available, skipping user fetch');
        setUsers([]);
        return;
      }
      
      console.log('Calling getAllUsers with email:', user.email);
      const usersData = await getAllUsers(user.email);
      console.log('Users fetched successfully:', usersData.length);
      console.log('User emails:', usersData.map(u => u.email));
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await getAdminStats(user?.email || undefined);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserAccess = async (userId: string, moduleAccess: ModuleAccess) => {
    try {
      setError(null);
      await updateUserModuleAccess(userId, moduleAccess, user?.email || undefined);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, moduleAccess } 
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update user access');
      console.error('Error updating user access:', err);
      throw err;
    }
  };

  const updateSubscription = async (
    userId: string, 
    tier: SubscriptionTier, 
    status: 'active' | 'inactive' | 'cancelled' | 'expired',
    endDate?: string,
    customModuleAccess?: ModuleAccess
  ) => {
    try {
      setError(null);
      await updateUserSubscription(userId, tier, status, endDate, user?.email || undefined, customModuleAccess);
      
      // Refresh users to get updated data
      await refreshUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
      console.error('Error updating subscription:', err);
      throw err;
    }
  };

  const updateUserAccessAndSubscription = async (
    userId: string,
    moduleAccess: ModuleAccess,
    tier: SubscriptionTier,
    status: 'active' | 'inactive' | 'cancelled' | 'expired',
    endDate?: string
  ) => {
    try {
      setError(null);
      await updateUserSubscription(userId, tier, status, endDate, user?.email || undefined, moduleAccess);
      
      // Refresh users to get updated data
      await refreshUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user access and subscription');
      console.error('Error updating user access and subscription:', err);
      throw err;
    }
  };

  const toggleUser = async (userId: string, isActive: boolean) => {
    try {
      setError(null);
      await toggleUserStatus(userId, isActive, user?.email || undefined);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isActive } 
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to toggle user status');
      console.error('Error toggling user status:', err);
      throw err;
    }
  };

  const removeUser = async (userId: string) => {
    try {
      setError(null);
      await deleteUser(userId, user?.email || undefined);
      
      // Remove from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
      console.error('Error removing user:', err);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Load initial data and set up real-time listeners
  useEffect(() => {
    if (!user?.email) {
      console.log('No user email, skipping admin data fetch');
      return;
    }
    
    console.log('User authenticated, fetching admin data...');
    refreshUsers();
    refreshStats();
    
    // Temporarily disable real-time listeners to isolate issues
    // Set up a simple interval for refreshing data instead of real-time listeners
    const interval = setInterval(() => {
      if (user?.email) {
        console.log('Refreshing admin data via interval...');
        refreshUsers();
        refreshStats();
      }
    }, 30000); // Refresh every 30 seconds
    
    const unsubscribe = () => clearInterval(interval);
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.email]);

  const value: AdminContextType = {
    users,
    stats,
    loading,
    error,
    isAdmin,
    refreshUsers,
    refreshStats,
    updateUserAccess,
    updateSubscription,
    updateUserAccessAndSubscription,
    toggleUser,
    removeUser,
    clearError
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};