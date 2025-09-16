

"use client";

import { useState, useMemo } from "react";
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


export default function TransactionsPage() {
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
  const { date } = useDateRange();
  const { formatCurrency } = useCurrency();

  const handleTriggerClick = (type: "income" | "expense") => {
    setTransactionType(type);
    setDialogTitle(type === "income" ? "Add Income" : "Add Expense");
    setAddDialogOpen(true);
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

    return filtered.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, date, filter]);

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center">
          <div>
            <CardTitle>Transactions</CardTitle>
          </div>
          <div className="ml-auto flex gap-2">
            <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                      className="gap-1"
                      variant="success"
                      onClick={() => handleTriggerClick("income")}
                      size="sm"
                      >
                      <PlusCircle className="h-4 w-4" />
                      <span className="sm:inline hidden">Add Income</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Add Income</p>
                  </TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                      className="gap-1"
                      variant="destructive"
                      onClick={() => handleTriggerClick("expense")}
                      size="sm"
                      >
                      <PlusCircle className="h-4 w-4" />
                      <span className="sm:inline hidden">Add Expense</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Add Expense</p>
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="mb-4 grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="all" className="flex items-center justify-center p-2 text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="income" className="flex items-center justify-center p-2 text-xs sm:text-sm">Income</TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center justify-center p-2 text-xs sm:text-sm">Expense</TabsTrigger>
            </TabsList>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    const nextDueDate = getNextRecurrenceDate(transaction);
                    return (
                    <TableRow key={transaction.id} onClick={() => handleRowClick(transaction)} className="cursor-pointer">
                      <TableCell className="font-medium">
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
                      <TableCell className="hidden sm:table-cell">{format(parseISO(transaction.date), 'PPP')}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{getCategoryName(transaction.categoryId)}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {nextDueDate ? format(nextDueDate, 'PPP') : '-'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          transaction.type === "income"
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
    </>
  );
}

    
