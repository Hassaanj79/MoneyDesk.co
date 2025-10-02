import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CustomReport, ReportModule, ReportData, ReportGenerationOptions } from '@/types';

const CUSTOM_REPORTS_COLLECTION = 'custom_reports';
const REPORT_MODULES_COLLECTION = 'report_modules';

// Predefined report modules
export const REPORT_MODULES: ReportModule[] = [
  // Financial Summary Modules
  {
    id: 'summary-cards',
    name: 'Financial Summary',
    description: 'Total income, expenses, and net savings overview',
    icon: 'Wallet',
    category: 'financial',
    dataType: 'summary',
    required: true,
    enabled: true,
  },
  {
    id: 'monthly-trends',
    name: 'Monthly Trends',
    description: 'Income and expense trends over time',
    icon: 'TrendingUp',
    category: 'analytics',
    dataType: 'chart',
    chartType: 'line',
    required: false,
    enabled: true,
  },
  {
    id: 'spending-by-category',
    name: 'Spending by Category',
    description: 'Breakdown of expenses by category',
    icon: 'PieChart',
    category: 'analytics',
    dataType: 'chart',
    chartType: 'pie',
    required: false,
    enabled: true,
  },
  {
    id: 'expenses-by-account',
    name: 'Expenses by Account',
    description: 'Expense distribution across accounts',
    icon: 'CreditCard',
    category: 'accounts',
    dataType: 'chart',
    chartType: 'bar',
    required: false,
    enabled: true,
  },
  {
    id: 'saving-trends',
    name: 'Saving Trends',
    description: 'Monthly savings patterns and trends',
    icon: 'PiggyBank',
    category: 'financial',
    dataType: 'chart',
    chartType: 'area',
    required: false,
    enabled: true,
  },
  {
    id: 'account-balance-distribution',
    name: 'Account Balance Distribution',
    description: 'Current balance across all accounts',
    icon: 'BarChart3',
    category: 'accounts',
    dataType: 'chart',
    chartType: 'bar',
    required: false,
    enabled: true,
  },
  {
    id: 'budget-performance',
    name: 'Budget Performance',
    description: 'Budget vs actual spending analysis',
    icon: 'Target',
    category: 'budgets',
    dataType: 'chart',
    chartType: 'composed',
    required: false,
    enabled: true,
  },
  {
    id: 'loan-status-overview',
    name: 'Loan Status Overview',
    description: 'Current loan status and payment progress',
    icon: 'FileText',
    category: 'loans',
    dataType: 'table',
    required: false,
    enabled: true,
  },
  {
    id: 'transaction-frequency',
    name: 'Transaction Frequency',
    description: 'Transaction patterns and frequency analysis',
    icon: 'Activity',
    category: 'transactions',
    dataType: 'chart',
    chartType: 'bar',
    required: false,
    enabled: true,
  },
  {
    id: 'top-categories',
    name: 'Top Categories',
    description: 'Most used income and expense categories',
    icon: 'List',
    category: 'transactions',
    dataType: 'table',
    required: false,
    enabled: true,
  },
  {
    id: 'recurring-transactions',
    name: 'Recurring Transactions',
    description: 'List of all recurring transactions',
    icon: 'Repeat',
    category: 'transactions',
    dataType: 'list',
    required: false,
    enabled: true,
  },
  {
    id: 'account-transactions',
    name: 'Account Transactions',
    description: 'Detailed transaction list by account',
    icon: 'CreditCard',
    category: 'accounts',
    dataType: 'table',
    required: false,
    enabled: true,
  },
];

// Create a custom report
export const createCustomReport = async (
  userId: string,
  reportData: Omit<CustomReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const reportDoc = {
      ...reportData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CUSTOM_REPORTS_COLLECTION), reportDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating custom report:', error);
    throw error;
  }
};

// Get all custom reports for a user
export const getUserCustomReports = async (userId: string): Promise<CustomReport[]> => {
  try {
    const q = query(
      collection(db, CUSTOM_REPORTS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      lastGenerated: doc.data().lastGenerated?.toDate(),
      dateRange: {
        from: doc.data().dateRange.from.toDate(),
        to: doc.data().dateRange.to.toDate(),
      },
    })) as CustomReport[];
    
    // Sort by createdAt in JavaScript instead of Firestore
    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching custom reports:', error);
    throw error;
  }
};

// Get a specific custom report
export const getCustomReport = async (reportId: string): Promise<CustomReport | null> => {
  try {
    const docRef = doc(db, CUSTOM_REPORTS_COLLECTION, reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastGenerated: data.lastGenerated?.toDate(),
        dateRange: {
          from: data.dateRange.from.toDate(),
          to: data.dateRange.to.toDate(),
        },
      } as CustomReport;
    }
    return null;
  } catch (error) {
    console.error('Error fetching custom report:', error);
    throw error;
  }
};

// Update a custom report
export const updateCustomReport = async (
  reportId: string,
  updates: Partial<Omit<CustomReport, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, CUSTOM_REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating custom report:', error);
    throw error;
  }
};

// Delete a custom report
export const deleteCustomReport = async (reportId: string): Promise<void> => {
  try {
    const docRef = doc(db, CUSTOM_REPORTS_COLLECTION, reportId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting custom report:', error);
    throw error;
  }
};

// Generate report data for specific modules
export const generateReportData = async (
  userId: string,
  modules: string[],
  dateRange: { from: Date; to: Date },
  options: ReportGenerationOptions
): Promise<ReportData[]> => {
  try {
    // This would typically call an API endpoint that processes the data
    // For now, we'll return a placeholder structure
    const reportData: ReportData[] = modules.map(moduleId => {
      const module = REPORT_MODULES.find(m => m.id === moduleId);
      return {
        moduleId,
        data: null, // This would be populated by the actual data generation logic
        metadata: {
          title: module?.name || 'Unknown Module',
          description: module?.description || '',
          generatedAt: new Date(),
          dataPoints: 0,
        },
      };
    });

    return reportData;
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
};

// Get available report modules
export const getReportModules = (): ReportModule[] => {
  return REPORT_MODULES;
};

// Get report modules by category
export const getReportModulesByCategory = (category: ReportModule['category']): ReportModule[] => {
  return REPORT_MODULES.filter(module => module.category === category);
};

// Listen to custom reports in real-time
export const listenToUserCustomReports = (
  userId: string,
  callback: (reports: CustomReport[]) => void,
  onError?: (error: any) => void
) => {
  // Use a simpler query that doesn't require a composite index
  const q = query(
    collection(db, CUSTOM_REPORTS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, 
    (querySnapshot) => {
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastGenerated: doc.data().lastGenerated?.toDate(),
        dateRange: {
          from: doc.data().dateRange.from.toDate(),
          to: doc.data().dateRange.to.toDate(),
        },
      })) as CustomReport[];
      
      // Sort by createdAt in JavaScript instead of Firestore
      reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      callback(reports);
    },
    (error) => {
      console.error('Error listening to custom reports:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};
