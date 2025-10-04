"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { 
  createCustomReport,
  getUserCustomReports,
  getCustomReport,
  updateCustomReport,
  deleteCustomReport,
  generateReportData,
  getReportModules,
  getReportModulesByCategory,
  listenToUserCustomReports,
  type CustomReport,
  type ReportModule,
  type ReportData,
  type ReportGenerationOptions
} from '@/services/custom-reports';

interface CustomReportsContextType {
  customReports: CustomReport[];
  reportModules: ReportModule[];
  loading: boolean;
  error: string | null;
  createReport: (report: Omit<CustomReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<CustomReport | null>;
  updateReport: (reportId: string, updates: Partial<CustomReport>) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  generateReport: (reportId: string, options: ReportGenerationOptions) => Promise<ReportData[]>;
  getModulesByCategory: (category: string) => ReportModule[];
  refreshReports: () => void;
}

const CustomReportsContext = createContext<CustomReportsContextType | undefined>(undefined);

export const CustomReportsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [reportModules, setReportModules] = useState<ReportModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load report modules on mount
  useEffect(() => {
    const loadModules = async () => {
      try {
        const modules = await getReportModules();
        setReportModules(modules);
      } catch (err) {
        console.error('Error loading report modules:', err);
        setError('Failed to load report modules');
      }
    };

    loadModules();
  }, []);

  // Load custom reports when user changes
  useEffect(() => {
    if (!user) {
      setCustomReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener only
    const unsubscribe = listenToUserCustomReports(
      user.uid, 
      (reports) => {
        setCustomReports(reports);
        setLoading(false);
      },
      (error) => {
        console.error('Error in custom reports listener:', error);
        setError('Failed to load custom reports');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const createReport = useCallback(async (report: Omit<CustomReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CustomReport | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setError(null);
      const newReport = await createCustomReport(user.uid, report);
      setCustomReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      console.error('Error creating custom report:', err);
      setError('Failed to create custom report');
      return null;
    }
  }, [user]);

  const updateReport = useCallback(async (reportId: string, updates: Partial<CustomReport>): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      await updateCustomReport(user.uid, reportId, updates);
      setCustomReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, ...updates, updatedAt: new Date() }
            : report
        )
      );
    } catch (err) {
      console.error('Error updating custom report:', err);
      setError('Failed to update custom report');
    }
  }, [user]);

  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      await deleteCustomReport(user.uid, reportId);
      setCustomReports(prev => prev.filter(report => report.id !== reportId));
    } catch (err) {
      console.error('Error deleting custom report:', err);
      setError('Failed to delete custom report');
    }
  }, [user]);

  const generateReport = useCallback(async (reportId: string, options: ReportGenerationOptions): Promise<ReportData[]> => {
    if (!user) {
      setError('User not authenticated');
      return [];
    }

    try {
      setError(null);
      const reportData = await generateReportData(user.uid, reportId, options);
      return reportData;
    } catch (err) {
      console.error('Error generating report data:', err);
      setError('Failed to generate report data');
      return [];
    }
  }, [user]);

  const getModulesByCategory = useCallback((category: string): ReportModule[] => {
    return getReportModulesByCategory(category);
  }, []);

  const refreshReports = useCallback(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    getUserCustomReports(user.uid)
      .then(reports => {
        setCustomReports(reports);
      })
      .catch(err => {
        console.error('Error refreshing custom reports:', err);
        setError('Failed to refresh custom reports');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <CustomReportsContext.Provider value={{
      customReports,
      reportModules,
      loading,
      error,
      createReport,
      updateReport,
      deleteReport,
      generateReport,
      getModulesByCategory,
      refreshReports
    }}>
      {children}
    </CustomReportsContext.Provider>
  );
};

export const useCustomReports = () => {
  const context = useContext(CustomReportsContext);
  if (context === undefined) {
    throw new Error('useCustomReports must be used within a CustomReportsProvider');
  }
  return context;
};