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
import { getAllCancellationRequests } from '@/services/cancellation-requests';
import type { AdminUser, AdminStats, ModuleAccess, SubscriptionTier, UserSubscription, CancellationRequest } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, onSnapshot, getDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminContextType {
      // State
      users: AdminUser[];
      stats: AdminStats | null;
      cancellationRequests: CancellationRequest[];
      loading: boolean;
      error: string | null;
      isAdmin: boolean;
      
      // Actions
      refreshUsers: () => Promise<void>;
      refreshStats: () => Promise<void>;
      refreshCancellationRequests: () => Promise<void>;
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
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
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

      const refreshCancellationRequests = async () => {
        try {
          setLoading(true);
          setError(null);
          const cancellationData = await getAllCancellationRequests();
          setCancellationRequests(cancellationData);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch cancellation requests');
          console.error('Error fetching cancellation requests:', err);
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
    console.log('Setting up real-time admin data listeners...');
    
    // Only set up listeners if user is admin
    if (!isAdmin) {
      console.log('User is not admin, skipping real-time listeners');
      return;
    }
    
    // Initial data load
    refreshUsers();
    refreshStats();
    refreshCancellationRequests();
    
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeCancellations: (() => void) | null = null;
    
    try {
      // Set up real-time listeners for users collection
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubscribeUsers = onSnapshot(usersQuery, 
        (snapshot) => {
          console.log('Real-time users update received:', snapshot.size, 'users');
          const users: AdminUser[] = [];
          
          snapshot.forEach(async (userDoc) => {
            const userData = userDoc.data();
            
            // Get user's subscription info
            try {
              const subscriptionDoc = await getDoc(doc(db, 'users', userDoc.id, 'subscription', 'current'));
              const subscription = subscriptionDoc.exists() ? subscriptionDoc.data() : null;
              
              // Get user's module access from subscription or default
              const moduleAccess: ModuleAccess = subscription?.features || {
                dashboard: true,
                transactions: true,
                loans: false,
                reports: false,
                settings: true,
                accounts: true,
                budgets: false,
                categories: true
              };
              
              // Create user record
              const adminUser: AdminUser = {
                id: userDoc.id,
                email: userData.email || '',
                name: userData.name || '',
                role: userData.role || 'user',
                moduleAccess,
                isActive: userData.isActive !== false,
                createdAt: userData.createdAt || new Date().toISOString(),
                lastLoginAt: userData.lastLoginAt,
                createdBy: userData.createdBy
              };
              
              users.push(adminUser);
            } catch (error) {
              console.error(`Error processing user ${userDoc.id}:`, error);
            }
          });
          
          // Update state with new users data
          setUsers(users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        },
        (error) => {
          console.error('Error in real-time users listener:', error);
          // Don't set error state for permission denied errors
          if (error.code !== 'permission-denied') {
            setError('Failed to sync user data in real-time');
          }
        }
      );
      
      // Set up real-time listener for cancellation requests
      const cancellationQuery = query(collection(db, 'cancellationRequests'), orderBy('createdAt', 'desc'));
      unsubscribeCancellations = onSnapshot(cancellationQuery, 
        (snapshot) => {
          console.log('Real-time cancellation requests update received:', snapshot.size, 'requests');
          const requests: CancellationRequest[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
              id: doc.id,
              ...data
            } as CancellationRequest);
          });
          
          setCancellationRequests(requests);
        },
        (error) => {
          console.error('Error in real-time cancellation requests listener:', error);
          // Don't set error state for permission denied errors
          if (error.code !== 'permission-denied') {
            setError('Failed to sync cancellation requests in real-time');
          }
        }
      );
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
    }
    
    // Set up real-time listener for admin stats (refresh every 2 minutes)
    const statsInterval = setInterval(() => {
      console.log('Refreshing admin stats...');
      refreshStats();
    }, 120000); // 2 minutes

    return () => {
      console.log('Cleaning up admin real-time listeners...');
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeCancellations) unsubscribeCancellations();
      clearInterval(statsInterval);
    };
  }, [isAdmin]);

      const value: AdminContextType = {
        users,
        stats,
        cancellationRequests,
        loading,
        error,
        isAdmin,
        refreshUsers,
        refreshStats,
        refreshCancellationRequests,
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