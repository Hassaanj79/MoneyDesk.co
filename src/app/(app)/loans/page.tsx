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
import { GiveLoanForm } from "@/components/loans/give-loan-form";
import { TakeLoanForm } from "@/components/loans/take-loan-form";
import { EditLoanForm } from "@/components/loans/edit-loan-form";
import { LoanDetails } from "@/components/loans/loan-details";
import { LoanRepayment } from "@/components/loans/loan-repayment";
import { cn } from "@/lib/utils";
import { PlusCircle, Trash2, Pencil, HandCoins, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import type { Loan } from "@/types";
import { useDateRange } from "@/contexts/date-range-context";
import { isWithinInterval, parseISO, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLoans } from "@/contexts/loan-context";
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
import { useAccounts } from "@/contexts/account-context";

function LoansPageContent() {
  const { loans, deleteLoan } = useLoans();
  const { accounts } = useAccounts();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanType, setLoanType] = useState<"given" | "taken">("given");
  const [dialogTitle, setDialogTitle] = useState("Give Loan");
  const [filter, setFilter] = useState<"all" | "given" | "taken">("all");
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { date } = useDateRange();
  const { formatCurrency } = useCurrency();

  const handleTriggerClick = (type: "given" | "taken") => {
    setLoanType(type);
    setDialogTitle(type === "given" ? "Give Loan" : "Take Loan");
    setAddDialogOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedLoans.length === filteredLoans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(filteredLoans.map(l => l.id));
    }
  };

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      for (const loanId of selectedLoans) {
        await deleteLoan(loanId);
      }
      setSelectedLoans([]);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting loans:', error);
    }
  };

  const handleRowClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setDetailsDialogOpen(true);
  };

  const handleEditClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setDetailsDialogOpen(false);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedLoan) {
      deleteLoan(selectedLoan.id);
    }
    setDeleteDialogOpen(false);
    setSelectedLoan(null);
  };
  
  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Unknown Account';
  };

  const getStatusColor = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    switch (status) {
      case 'active':
        return isOverdue ? 'destructive' : 'default';
      case 'completed':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    switch (status) {
      case 'active':
        return isOverdue ? <AlertTriangle className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <HandCoins className="h-4 w-4" />;
    }
  };

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    if (date?.from && date?.to) {
      filtered = filtered.filter(loan => 
        isWithinInterval(parseISO(loan.startDate), { start: date.from, end: date.to })
      );
    }

    if (filter !== "all") {
      filtered = filtered.filter(loan => loan.type === filter);
    }

    return filtered.sort((a, b) => {
      // Sort by createdAt timestamp for newest first
      // Both loans should have createdAt as they're created with it
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime; // Newest first
    });
  }, [loans, date, filter]);

  // Calculate loan statistics
  const loanStats = useMemo(() => {
    const givenLoans = loans.filter(loan => loan.type === 'given');
    const takenLoans = loans.filter(loan => loan.type === 'taken');
    
    const totalGiven = givenLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalTaken = takenLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const remainingGiven = givenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const remainingTaken = takenLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    // Calculate additional insights
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const completedLoans = loans.filter(loan => loan.status === 'completed');
    const overdueLoans = loans.filter(loan => {
      const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === 'active';
      return isOverdue;
    });
    
    // Calculate average loan amounts
    const avgGivenAmount = givenLoans.length > 0 ? totalGiven / givenLoans.length : 0;
    const avgTakenAmount = takenLoans.length > 0 ? totalTaken / takenLoans.length : 0;
    
    // Calculate interest-bearing loans
    const interestLoans = loans.filter(loan => loan.interestRate && loan.interestRate > 0);
    const avgInterestRate = interestLoans.length > 0 
      ? interestLoans.reduce((sum, loan) => sum + (loan.interestRate || 0), 0) / interestLoans.length 
      : 0;
    
    // Recent loans (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLoans = loans.filter(loan => 
      parseISO(loan.startDate) >= thirtyDaysAgo
    );
    
    return {
      totalGiven,
      totalTaken,
      remainingGiven,
      remainingTaken,
      netPosition: remainingGiven - remainingTaken,
      activeCount: activeLoans.length,
      completedCount: completedLoans.length,
      overdueCount: overdueLoans.length,
      totalCount: loans.length,
      avgGivenAmount,
      avgTakenAmount,
      interestLoansCount: interestLoans.length,
      avgInterestRate,
      recentCount: recentLoans.length
    };
  }, [loans]);

  return (
    <div>
      {/* Loan Summary */}
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="total" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="total">Total Amount</TabsTrigger>
              <TabsTrigger value="remaining">Remaining Amount</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="total" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Given</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(loanStats.totalGiven)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Taken</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(loanStats.totalTaken)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="remaining" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Outstanding Given</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(loanStats.remainingGiven)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Outstanding Taken</div>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(loanStats.remainingTaken)}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="insights" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Active Loans</div>
                    <div className="text-2xl font-bold text-green-600">{loanStats.activeCount}</div>
                    <div className="text-xs text-muted-foreground">Currently active</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Completed Loans</div>
                    <div className="text-2xl font-bold text-blue-600">{loanStats.completedCount}</div>
                    <div className="text-xs text-muted-foreground">Successfully repaid</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Overdue Loans</div>
                    <div className="text-2xl font-bold text-red-600">{loanStats.overdueCount}</div>
                    <div className="text-xs text-muted-foreground">Past due date</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Average Given</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(loanStats.avgGivenAmount)}</div>
                    <div className="text-xs text-muted-foreground">Per given loan</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Average Taken</div>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(loanStats.avgTakenAmount)}</div>
                    <div className="text-xs text-muted-foreground">Per taken loan</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Interest Rate</div>
                    <div className="text-2xl font-bold text-purple-600">{loanStats.avgInterestRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Average APR</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Interest Loans</div>
                    <div className="text-2xl font-bold text-indigo-600">{loanStats.interestLoansCount}</div>
                    <div className="text-xs text-muted-foreground">With interest rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Recent Activity</div>
                    <div className="text-2xl font-bold text-cyan-600">{loanStats.recentCount}</div>
                    <div className="text-xs text-muted-foreground">Last 30 days</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Loans</div>
                    <div className="text-2xl font-bold text-gray-600">{loanStats.totalCount}</div>
                    <div className="text-xs text-muted-foreground">All time</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">Loans</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your given and taken loans
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleTriggerClick("given")}
                      className="flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <HandCoins className="h-4 w-4" />
                      <span className="hidden sm:inline">Give Loan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Give Loan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleTriggerClick("taken")}
                      variant="outline"
                      className="flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Take Loan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Take Loan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LoanRepayment />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Record Loan Repayment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Loans</TabsTrigger>
              <TabsTrigger value="given">Given</TabsTrigger>
              <TabsTrigger value="taken">Taken</TabsTrigger>
            </TabsList>
            {selectedLoans.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                <span className="text-sm text-muted-foreground">
                  {selectedLoans.length} loan{selectedLoans.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLoans([])}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Remaining</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Account</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => {
                    const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === 'active';
                    return (
                      <TableRow key={loan.id} className="cursor-pointer">
                        <TableCell className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedLoans.includes(loan.id)}
                            onChange={() => handleSelectLoan(loan.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium" onClick={() => handleRowClick(loan)}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{loan.borrowerName}</span>
                              {loan.interestRate && loan.interestRate > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {loan.interestRate}% APR
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                              <Badge variant={loan.type === 'given' ? 'default' : 'secondary'} className="text-xs">
                                {loan.type === 'given' ? 'Given' : 'Taken'}
                              </Badge>
                              <span className="font-bold">{formatCurrency(loan.amount)}</span>
                              <Badge 
                                variant={getStatusColor(loan.status, loan.dueDate)} 
                                className="flex items-center gap-1 text-xs"
                              >
                                {getStatusIcon(loan.status, loan.dueDate)}
                                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                {isOverdue && ' (Overdue)'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell" onClick={() => handleRowClick(loan)}>
                          <Badge variant={loan.type === 'given' ? 'default' : 'secondary'}>
                            {loan.type === 'given' ? 'Given' : 'Taken'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-bold" onClick={() => handleRowClick(loan)}>
                          {formatCurrency(loan.amount)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-bold" onClick={() => handleRowClick(loan)}>
                          {formatCurrency(loan.remainingAmount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell" onClick={() => handleRowClick(loan)}>
                          <Badge 
                            variant={getStatusColor(loan.status, loan.dueDate)} 
                            className="flex items-center gap-1 w-fit"
                          >
                            {getStatusIcon(loan.status, loan.dueDate)}
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            {isOverdue && ' (Overdue)'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`hidden md:table-cell ${isOverdue ? 'text-red-500' : ''}`} onClick={() => handleRowClick(loan)}>
                          {format(parseISO(loan.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell" onClick={() => handleRowClick(loan)}>
                          <span className="text-sm text-muted-foreground">
                            {getAccountName(loan.accountId)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(loan);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(loan);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center"
                    >
                      No loans found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen} modal={false}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {loanType === "given" ? (
            <GiveLoanForm onSuccess={() => setAddDialogOpen(false)} />
          ) : (
            <TakeLoanForm onSuccess={() => setAddDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <LoanDetails loan={selectedLoan}>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => handleEditClick(selectedLoan)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteClick(selectedLoan)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </LoanDetails>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Loan</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <EditLoanForm
              loan={selectedLoan}
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
              This action cannot be undone. This will permanently delete this loan record.
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
            <AlertDialogTitle>Delete Selected Loans</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLoans.length} loan{selectedLoans.length > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently delete the selected loan records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedLoans.length} Loan{selectedLoans.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LoansPage() {
  return (
    <ProtectedRoute module="loans">
      <LoansPageContent />
    </ProtectedRoute>
  );
}