

"use client";

import { useState, useMemo } from "react";
import { AddAccountForm } from "@/components/accounts/add-account-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { Account } from "@/types";
import { PlusCircle, Trash2, Wallet } from "lucide-react";
import { useTransactions } from "@/contexts/transaction-context";
import { useCurrency } from "@/hooks/use-currency";
// import { useNotifications } from "@/contexts/notification-context";
import { useAccounts } from "@/contexts/account-context";

function getAccountTypeLabel(type: Account['type']) {
    switch (type) {
        case 'bank': return 'Bank Account';
        case 'credit-card': return 'Credit Card';
        case 'debit-card': return 'Debit Card';
        case 'paypal': return 'PayPal';
        case 'zelle': return 'Zelle';
        case 'cash-app': return 'Cash App';
        case 'cash': return 'Cash';
        case 'custom': return 'Custom';
    }
}

export default function AccountsPage() {
  const { accounts, deleteAccount } = useAccounts();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();
  // const { addNotification } = useNotifications();


  const processedAccounts: Account[] = useMemo(() => {
    return accounts.map((account) => {
      // Calculate balance from transactions to ensure accuracy
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const calculatedBalance = accountTransactions.reduce((sum, t) => {
        const positiveAmount = Math.abs(t.amount);
        return sum + (t.type === 'income' ? positiveAmount : -positiveAmount);
      }, account.initialBalance || 0);
      
      return { ...account, balance: calculatedBalance };
    })
  }, [accounts, transactions]);

  const handleAddAccountSuccess = (newAccountName: string) => {
    setAddDialogOpen(false);
    // addNotification({
    //   type: 'account_created',
    //   title: 'Account Added',
    //   message: `The account "${newAccountName}" has been added successfully.`,
    //   navigationPath: '/accounts'
    // });
  }

  const handleDeleteClick = (account: Account) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (selectedAccount) {
      await deleteAccount(selectedAccount.id);
       // addNotification({
       //   type: 'account_deleted',
       //   title: 'Account Deleted',
       //   message: `The account "${selectedAccount.name}" has been deleted.`,
       //   navigationPath: '/accounts'
       // });
    }
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  }

  return (
    <>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Accounts</CardTitle>
              <CardDescription className="text-sm">
                Manage your financial accounts.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {processedAccounts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
                <p className="text-sm mb-4">Get started by adding your first account to track your finances.</p>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 sm:px-6">Account Name</TableHead>
                      <TableHead className="hidden sm:table-cell px-3 sm:px-6">Type</TableHead>
                      <TableHead className="text-right px-3 sm:px-6">Balance</TableHead>
                      <TableHead className="text-right px-3 sm:px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedAccounts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm sm:text-base truncate">{account.name}</span>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {getAccountTypeLabel(account.type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <span className="text-sm">{getAccountTypeLabel(account.type)}</span>
                        </TableCell>
                        <TableCell className="text-right px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-semibold text-sm sm:text-base">
                            {formatCurrency(account.balance)}
                          </div>
                        </TableCell>
                         <TableCell className="text-right px-3 sm:px-6 py-3 sm:py-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(account);
                            }}
                            className="h-8 w-8 p-0 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Account</DialogTitle>
          </DialogHeader>
          <AddAccountForm onSuccess={handleAddAccountSuccess}/>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account. Related transactions will NOT be deleted.
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
