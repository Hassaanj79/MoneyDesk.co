

"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { cn } from "@/lib/utils";
import { PlusCircle, Trash2, Pencil, Repeat } from "lucide-react";
import type { Transaction } from "@/types";
import { useDateRange } from "@/contexts/date-range-context";
import { isWithinInterval, parseISO, format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTransactions } from "@/contexts/transaction-context";
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

const getNextRecurrenceDate = (transaction: Transaction): Date | null => {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return null;
    }

    const startDate = parseISO(transaction.date);
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
  const { transactions, deleteTransaction } = useTransactions();
  const { categories } = useCategories();
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
  const { formatCurrency } = useCurrency();

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

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (date?.from && date?.to) {
      filtered = filtered.filter((t) =>
        isWithinInterval(parseISO(t.date), { start: date.from!, end: date.to! })
      );
    }

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.type === filter);
    }

    return filtered.sort((a,b) => {
      // Sort by createdAt timestamp for newest first
      // If createdAt exists, use it; otherwise fall back to Firebase document ID
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (a.createdAt && !b.createdAt) {
        return -1; // a is newer
      } else if (!a.createdAt && b.createdAt) {
        return 1; // b is newer
      } else {
        // Fall back to Firebase document ID comparison
        return b.id.localeCompare(a.id);
      }
    });
  }, [transactions, date, filter]);

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
      parseISO(t.date) >= sevenDaysAgo
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
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(transactionStats.totalIncome)}</div>
                    <div className="text-xs text-muted-foreground">{transactionStats.incomeCount} transaction{transactionStats.incomeCount !== 1 ? 's' : ''}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(transactionStats.totalExpense)}</div>
                    <div className="text-xs text-muted-foreground">{transactionStats.expenseCount} transaction{transactionStats.expenseCount !== 1 ? 's' : ''}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Net Savings</div>
                    <div className={`text-2xl font-bold ${transactionStats.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    const nextDueDate = getNextRecurrenceDate(transaction);
                    return (
                    <TableRow key={transaction.id} className="cursor-pointer">
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
                            {transaction.isRecurring && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline" className="flex items-center gap-1 capitalize text-xs">
                                                <Repeat className="h-3 w-3" />
                                                <span className="hidden sm:inline">{transaction.recurrenceFrequency}</span>
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>This is a recurring transaction.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                            <span>{format(parseISO(transaction.date), 'MMM d')}</span>
                            <Badge variant="outline" className="text-xs">{getCategoryName(transaction.categoryId)}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" onClick={() => handleRowClick(transaction)}>{format(parseISO(transaction.date), 'PPP')}</TableCell>
                      <TableCell className="hidden md:table-cell" onClick={() => handleRowClick(transaction)}>
                        <Badge variant="outline">{getCategoryName(transaction.categoryId)}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={() => handleRowClick(transaction)}>
                        {nextDueDate ? format(nextDueDate, 'PPP') : '-'}
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
