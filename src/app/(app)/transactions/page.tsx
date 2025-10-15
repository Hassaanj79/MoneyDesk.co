
"use client";

import { useState, useMemo, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { cn } from "@/lib/utils";
import { PlusCircle, Trash2, Pencil, Clock, FileText, Filter, X, Calendar, Search } from "lucide-react";
import type { Transaction } from "@/types";
import { useDateRange } from "@/contexts/date-range-context";
import { isWithinInterval, parseISO, format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTransactions } from "@/contexts/transaction-context";
import { useAccounts } from "@/contexts/account-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";
import { useCategories } from "@/contexts/category-context";
import { useAuth } from "@/contexts/auth-context";
import { formatAmount } from "@/utils/format-amount";
import { toast } from "sonner";


// Helper function to safely convert date to Date object
const getDate = (dateValue: any): Date => {
  if (typeof dateValue === 'string') {
    return parseISO(dateValue);
  } else if (dateValue instanceof Date) {
    return dateValue;
  } else if (dateValue && typeof dateValue.toDate === 'function') {
    // Firestore timestamp
    return dateValue.toDate();
  } else if (dateValue && typeof dateValue.toISOString === 'function') {
    return new Date(dateValue.toISOString());
  }
  return new Date(); // fallback
};

// Safe date formatting functions
const formatDate = (date: Date, format: string): string => {
  try {
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    switch (format) {
      case 'MMM d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'PPP':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'MMM dd, yyyy':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric' 
        });
      case 'yyyy-MM-dd':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const getNextRecurrenceDate = (transaction: Transaction): Date | null => {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return null;
    }

    const startDate = getDate(transaction.date);
    const now = new Date();
    let nextDate = startDate;

    const incrementDate = (date: Date): Date => {
        switch (transaction.recurrenceFrequency) {
            case 'daily':
                return addDays(date, 1);
            case 'weekly':
                return addWeeks(date, 1);
            case 'monthly':
                return addMonths(date, 1);
            case 'yearly':
                return addYears(date, 1);
            default:
                return addDays(date, 1);
        }
    };
    
    while (nextDate < now) {
        nextDate = incrementDate(nextDate);
    }
    
    let previousDate = startDate;
    while(previousDate < now) {
        const temp = incrementDate(previousDate);
        if (temp > now) {
            break;
        }
        previousDate = temp;
    }
    
    nextDate = incrementDate(previousDate);

    return nextDate;
};


function TransactionsPageContent() {
  const { t } = useTranslation();
  const { transactions, deleteTransaction, loading, addTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { user } = useAuth();
  

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [dialogTitle, setDialogTitle] = useState("Add Expense");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { date } = useDateRange();
  const { formatCurrency, currency } = useCurrency();
  
  // Filter states
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense' | 'recurring',
    name: '',
    startDate: '',
    endDate: '',
    categoryId: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Date range filter (from date picker)
    if (date?.from && date?.to) {
      filtered = filtered.filter((t) =>
        isWithinInterval(getDate(t.date), { start: date.from!, end: date.to! })
      );
    }

    // Custom filters
    filtered = filtered.filter(transaction => {
      // Type filter
      if (filters.type !== 'all') {
        if (filters.type === 'recurring') {
          if (!transaction.isRecurring) {
            return false;
          }
        } else if (transaction.type !== filters.type) {
          return false;
        }
      }
      
      // Name filter
      if (filters.name && !transaction.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      // Date range filter (from custom filters)
      if (filters.startDate) {
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(filters.startDate);
        if (transactionDate < startDate) {
          return false;
        }
      }
      
      if (filters.endDate) {
        const transactionDate = new Date(transaction.date);
        const endDate = new Date(filters.endDate);
        if (transactionDate > endDate) {
          return false;
        }
      }
      
      // Category filter
      if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
        return false;
      }
      
      // Amount range filter
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount) && transaction.amount < minAmount) {
          return false;
        }
      }
      
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (!isNaN(maxAmount) && transaction.amount > maxAmount) {
          return false;
        }
      }
      
      return true;
    });

    return filtered.sort((a,b) => {
      // Sort by createdAt timestamp for newest first
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return 0;
    });
  }, [transactions, filters, date]);

  // Filter functions
  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      name: '',
      startDate: '',
      endDate: '',
      categoryId: '',
      minAmount: '',
      maxAmount: ''
    });
    toast.success('Filters cleared');
  };

  // Calculate upcoming recurring transactions
  const upcomingTransactions = useMemo(() => {
    const recurring = transactions.filter(t => t.isRecurring && t.recurrenceFrequency);
    const upcoming = recurring.map(transaction => {
      const nextDueDate = getNextRecurrenceDate(transaction);
      if (nextDueDate) {
        const daysUntilDue = Math.ceil((nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
          transaction,
          nextDueDate,
          daysUntilDue
        };
      }
      return null;
    }).filter(item => item !== null && item.daysUntilDue <= 30 && item.daysUntilDue >= 0);
    
    return upcoming.sort((a, b) => a!.daysUntilDue - b!.daysUntilDue);
  }, [transactions]);


  const handleTriggerClick = (type: "income" | "expense") => {
    setTransactionType(type);
    setDialogTitle(type === "income" ? "Add Income" : "Add Expense");
    setAddDialogOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      for (const transactionId of selectedTransactions) {
        await deleteTransaction(transactionId);
      }
      setSelectedTransactions([]);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  }

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(false);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id);
    }
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  }
  
  const getCategoryName = (categoryId: string) => {
      return categories.find(c => c.id === categoryId)?.name || 'N/A'
  }


  // Calculate transaction statistics
  const transactionStats = useMemo(() => {
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    
    const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
    const avgExpense = expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;
    
    // Calculate top expense categories
    const categoryExpenses = expenseTransactions.reduce((acc, t) => {
      const categoryName = getCategoryName(t.categoryId);
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topExpenseCategories = Object.entries(categoryExpenses)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
    
    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTransactions = filteredTransactions.filter(t => 
      getDate(t.date) >= sevenDaysAgo
    );
    
    return {
      totalIncome,
      totalExpense,
      netSavings,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      totalCount: filteredTransactions.length,
      avgIncome,
      avgExpense,
      topExpenseCategories,
      recentCount: recentTransactions.length
    };
  }, [filteredTransactions, getCategoryName]);

  return (
    <>
      {/* Transaction Summary */}
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="averages">Averages</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Income</div>
                    <div className="text-2xl font-bold text-green-600 break-all whitespace-nowrap" title={formatCurrency(transactionStats.totalIncome)}>{formatCurrency(transactionStats.totalIncome)}</div>
                    <div className="text-xs text-muted-foreground">{transactionStats.incomeCount} transaction{transactionStats.incomeCount !== 1 ? 's' : ''}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600 break-all whitespace-nowrap" title={formatCurrency(transactionStats.totalExpense)}>{formatCurrency(transactionStats.totalExpense)}</div>
                    <div className="text-xs text-muted-foreground">{transactionStats.expenseCount} transaction{transactionStats.expenseCount !== 1 ? 's' : ''}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Net Savings</div>
                    <div className={`text-2xl font-bold break-all whitespace-nowrap ${transactionStats.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`} title={formatCurrency(transactionStats.netSavings)}>
                      {formatCurrency(transactionStats.netSavings)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transactionStats.netSavings >= 0 ? 'Positive' : 'Negative'} balance
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
                    <div className="text-2xl font-bold text-blue-600">{transactionStats.totalCount}</div>
                    <div className="text-xs text-muted-foreground">All transactions</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="averages" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Average Income</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(transactionStats.avgIncome)}</div>
                    <div className="text-xs text-muted-foreground">Per income transaction</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Average Expense</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(transactionStats.avgExpense)}</div>
                    <div className="text-xs text-muted-foreground">Per expense transaction</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="insights" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-3">Top Expense Categories</div>
                    {transactionStats.topExpenseCategories.length > 0 ? (
                      <div className="space-y-2">
                        {transactionStats.topExpenseCategories.map((item, index) => (
                          <div key={item.category} className="flex justify-between items-center">
                            <span className="text-sm">{index + 1}. {item.category}</span>
                            <span className="text-sm font-medium text-red-600">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No expense data available</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Recent Activity</div>
                    <div className="text-2xl font-bold text-blue-600">{transactionStats.recentCount}</div>
                    <div className="text-xs text-muted-foreground">Transactions in last 7 days</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {transactionStats.recentCount > 0 
                        ? `Active period with ${transactionStats.recentCount} recent transactions`
                        : 'No recent activity'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">{t('transactions.title')}</CardTitle>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                      className="gap-1 flex-1 sm:flex-initial"
                      variant="success"
                      onClick={() => handleTriggerClick("income")}
                      size="sm"
                      >
                      <PlusCircle className="h-4 w-4" />
                      <span className="sm:inline hidden">{t('transactions.addIncome')}</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{t('transactions.addIncome')}</p>
                  </TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                      className="gap-1 flex-1 sm:flex-initial"
                      variant="destructive"
                      onClick={() => handleTriggerClick("expense")}
                      size="sm"
                      >
                      <PlusCircle className="h-4 w-4" />
                      <span className="sm:inline hidden">{t('transactions.addExpense')}</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{t('transactions.addExpense')}</p>
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {(filters.name || filters.startDate || filters.endDate || filters.categoryId || filters.minAmount || filters.maxAmount || filters.type !== 'all') && (
                    <Badge variant="secondary" className="ml-1">
                      Active
                    </Badge>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Generate report with filtered data
                      
                      // Generate and download Excel report
                      const reportData = {
                        totalTransactions: filteredTransactions.length,
                        totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                        totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                        recurringTransactions: filteredTransactions.filter(t => t.isRecurring).length,
                        dateRange: date?.from && date?.to ? `${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}` : 'All time',
                        generatedAt: new Date().toISOString()
                      };
                      
                      // Create and download Excel (CSV format)
                      const csvContent = `Transaction Report
Generated: ${new Date().toLocaleDateString()}
Date Range: ${reportData.dateRange}

Applied Filters:
Type: ${filters.type === 'all' ? 'All Types' : filters.type}
Name: ${filters.name || 'All Names'}
Start Date: ${filters.startDate || 'Not Set'}
End Date: ${filters.endDate || 'Not Set'}
Category: ${filters.categoryId ? getCategoryName(filters.categoryId) : 'All Categories'}
Min Amount: ${filters.minAmount || 'Not Set'}
Max Amount: ${filters.maxAmount || 'Not Set'}

Summary:
Total Transactions: ${reportData.totalTransactions}
Total Income: ${formatCurrency(reportData.totalIncome)}
Total Expenses: ${formatCurrency(reportData.totalExpense)}
Net: ${formatCurrency(reportData.totalIncome - reportData.totalExpense)}
Recurring Transactions: ${reportData.recurringTransactions}

Transaction Details:
Date,Name,Type,Amount,Category
${filteredTransactions.map(t => {
  const transactionDate = getDate(t.date);
  const formattedDate = formatDate(transactionDate, 'yyyy-MM-dd');
  return `${formattedDate},"${t.name}",${t.type},${t.amount},"${getCategoryName(t.categoryId)}"`;
}).join('\n')}`;

                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success('Excel report downloaded successfully!');
                    }}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download Excel
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Generate PDF report with filtered data
                      
                      // Generate and download PDF report
                      const reportData = {
                        totalTransactions: filteredTransactions.length,
                        totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                        totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                        recurringTransactions: filteredTransactions.filter(t => t.isRecurring).length,
                        dateRange: date?.from && date?.to ? `${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}` : 'All time',
                        generatedAt: new Date().toISOString()
                      };
                      
                      // Create HTML content for PDF
                      const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Transaction Report</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .section { margin-bottom: 20px; }
                            .section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
                            .filters { background-color: #e9ecef; padding: 15px; border-radius: 5px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>Transaction Report</h1>
                            <p>Generated: ${new Date().toLocaleDateString()}</p>
                            <p>Date Range: ${reportData.dateRange}</p>
                          </div>
                          
                          <div class="section filters">
                            <h3>Applied Filters</h3>
                            <p><strong>Type:</strong> ${filters.type === 'all' ? 'All Types' : filters.type}</p>
                            <p><strong>Name:</strong> ${filters.name || 'All Names'}</p>
                            <p><strong>Start Date:</strong> ${filters.startDate || 'Not Set'}</p>
                            <p><strong>End Date:</strong> ${filters.endDate || 'Not Set'}</p>
                            <p><strong>Category:</strong> ${filters.categoryId ? getCategoryName(filters.categoryId) : 'All Categories'}</p>
                            <p><strong>Min Amount:</strong> ${filters.minAmount || 'Not Set'}</p>
                            <p><strong>Max Amount:</strong> ${filters.maxAmount || 'Not Set'}</p>
                          </div>
                          
                          <div class="section summary">
                            <h3>Summary</h3>
                            <p><strong>Total Transactions:</strong> ${reportData.totalTransactions}</p>
                            <p><strong>Total Income:</strong> ${formatCurrency(reportData.totalIncome)}</p>
                            <p><strong>Total Expenses:</strong> ${formatCurrency(reportData.totalExpense)}</p>
                            <p><strong>Net:</strong> ${formatCurrency(reportData.totalIncome - reportData.totalExpense)}</p>
                            <p><strong>Recurring Transactions:</strong> ${reportData.recurringTransactions}</p>
                          </div>
                          
                          <div class="section">
                            <h3>Transaction Details</h3>
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Name</th>
                                  <th>Type</th>
                                  <th>Amount</th>
                                  <th>Category</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${filteredTransactions.map(t => {
                                  const transactionDate = getDate(t.date);
                                  const formattedDate = formatDate(transactionDate, 'yyyy-MM-dd');
                                  return `
                                    <tr>
                                      <td>${formattedDate}</td>
                                      <td>${t.name}</td>
                                      <td>${t.type}</td>
                                      <td>${formatCurrency(t.amount)}</td>
                                      <td>${getCategoryName(t.categoryId)}</td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                          </div>
                        </body>
                        </html>
                      `;
                      
                      // Create a new window and print to PDF
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write(htmlContent);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                      
                      toast.success('PDF report opened for printing!');
                    }}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                {/* Transaction Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Name Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={filters.name}
                      onChange={(e) => updateFilter('name', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Start Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(new Date(filters.startDate), 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.startDate ? new Date(filters.startDate) : undefined}
                        onSelect={(date) => updateFilter('startDate', date ? date.toISOString().split('T')[0] : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* End Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(new Date(filters.endDate), 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.endDate ? new Date(filters.endDate) : undefined}
                        onSelect={(date) => updateFilter('endDate', date ? date.toISOString().split('T')[0] : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filters.categoryId || "all"} onValueChange={(value) => updateFilter('categoryId', value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Min Amount Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter('minAmount', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                
                {/* Max Amount Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Amount</label>
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={filters.maxAmount}
                    onChange={(e) => updateFilter('maxAmount', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

              <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                <TabsList className="mb-4 grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="all" className="flex items-center justify-center p-2 text-xs sm:text-sm">{t('common.all')}</TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center justify-center p-2 text-xs sm:text-sm">{t('transactions.income')}</TabsTrigger>
                  <TabsTrigger value="expense" className="flex items-center justify-center p-2 text-xs sm:text-sm">{t('transactions.expense')}</TabsTrigger>
                </TabsList>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTransactions([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    const nextDueDate = getNextRecurrenceDate(transaction);
                    return (
                    <TableRow key={`${transaction.id}-${transaction.createdAt?.getTime() || transaction.date}`} className="cursor-pointer">
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => handleSelectTransaction(transaction.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => handleRowClick(transaction)}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{transaction.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                            <span>{formatDate(getDate(transaction.date), 'MMM d')}</span>
                            <Badge variant="outline" className="text-xs">{getCategoryName(transaction.categoryId)}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" onClick={() => handleRowClick(transaction)}>{formatDate(getDate(transaction.date), 'PPP')}</TableCell>
                      <TableCell className="hidden md:table-cell" onClick={() => handleRowClick(transaction)}>
                        <Badge variant="outline">{getCategoryName(transaction.categoryId)}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={() => handleRowClick(transaction)}>
                        {nextDueDate ? formatDate(nextDueDate, 'PPP') : '-'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          transaction.type === "income"
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                        onClick={() => handleRowClick(transaction)}
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransactionType(transaction.type);
                                    setDialogTitle("Edit Transaction");
                                    setSelectedTransaction(transaction);
                                    setEditDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Transaction</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTransaction(transaction);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Transaction</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center"
                    >
                      No transactions found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
              </Tabs>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            type={transactionType}
            onSuccess={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionDetails transaction={selectedTransaction}>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => handleEditClick(selectedTransaction)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteClick(selectedTransaction)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </TransactionDetails>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <EditTransactionForm
              transaction={selectedTransaction}
              onSuccess={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

       {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently delete the selected transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedTransactions.length} Transaction{selectedTransactions.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </>
  );
}

export default function TransactionsPage() {
  return (
    <ProtectedRoute module="transactions">
      <TransactionsPageContent />
    </ProtectedRoute>
  );
}
