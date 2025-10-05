"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import {
  addReportLog,
  listenToUserReportLogs,
} from '@/services/report-logs';
import { ReportLog } from '@/types';

interface ReportLogsContextType {
  reportLogs: ReportLog[];
  loading: boolean;
  error: string | null;
  logReport: (
    reportName: string,
    reportType: 'pdf' | 'csv' | 'excel',
    dateRange: { from: Date; to: Date },
    status: 'success' | 'error',
    metadata?: { [key: string]: any }
  ) => Promise<void>;
}

const ReportLogsContext = createContext<ReportLogsContextType | undefined>(undefined);

export const ReportLogsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReportLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenToUserReportLogs(
      user.uid,
      (logs) => {
        setReportLogs(logs);
        setLoading(false);
      },
      (err) => {
        console.error('Error in report logs listener:', err);
        setError('Failed to load report logs');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const logReport = useCallback(async (
    reportName: string,
    reportType: 'pdf' | 'csv' | 'excel',
    dateRange: { from: Date; to: Date },
    status: 'success' | 'error',
    metadata?: { [key: string]: any }
  ) => {
    if (!user) {
      console.error('User not authenticated, cannot log report.');
      return;
    }
    try {
      await addReportLog(user.uid, {
        reportName,
        reportType,
        dateRange,
        status,
        metadata,
      });
    } catch (err) {
      console.error('Failed to add report log:', err);
      setError('Failed to log report activity');
    }
  }, [user]);

  return (
    <ReportLogsContext.Provider value={{ reportLogs, loading, error, logReport }}>
      {children}
    </ReportLogsContext.Provider>
  );
};

export const useReportLogs = () => {
  const context = useContext(ReportLogsContext);
  if (context === undefined) {
    throw new Error('useReportLogs must be used within a ReportLogsProvider');
  }
  return context;
};