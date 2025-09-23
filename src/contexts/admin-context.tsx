"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getAdminStats, 
  getAllUsers, 
  getUserByEmail,
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
      searchUserByEmail: (email: string) => Promise<AdminUser | null>;
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

      const searchUserByEmail = async (email: string): Promise<AdminUser | null> => {
        try {
          setLoading(true);
          setError(null);
          console.log('Searching for user with email:', email);
          const foundUser = await getUserByEmail(email, user?.email || undefined);
          console.log('Search result:', foundUser);
          return foundUser;
        } catch (err: any) {
          setError(err.message || 'Failed to search user');
          console.error('Error searching user:', err);
          return null;
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
    // TEMPORARILY BYPASS AUTHENTICATION FOR DEBUGGING
    // This allows us to fetch admin data without authentication
    console.log('Bypassing authentication - fetching admin data...');
    refreshUsers();
    refreshStats();
    
    // Set up a simple interval for refreshing data
    const interval = setInterval(() => {
      console.log('Refreshing admin data via interval...');
      refreshUsers();
      refreshStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

      const value: AdminContextType = {
        users,
        stats,
        loading,
        error,
        isAdmin,
        refreshUsers,
        refreshStats,
        searchUserByEmail,
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