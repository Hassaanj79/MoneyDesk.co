

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
import { useNotifications } from "@/hooks/use-notifications";
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
  const { addNotification } = useNotifications();


  const processedAccounts: Account[] = useMemo(() => {
    return accounts.map((account) => {
      const balance = transactions.reduce((acc, t) => {
        if (t.accountId === account.id) {
          return acc + (t.type === 'income' ? t.amount : -t.amount);
        }
        return acc;
      }, account.initialBalance);
      return { ...account, balance };
    })
  }, [accounts, transactions]);

  const handleAddAccountSuccess = (newAccountName: string) => {
    setAddDialogOpen(false);
    addNotification({
        icon: Wallet,
        title: 'Account Added',
        description: `The account "${newAccountName}" has been added successfully.`
    })
  }

  const handleDeleteClick = (account: Account) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (selectedAccount) {
      await deleteAccount(selectedAccount.id);
       addNotification({
        icon: Trash2,
        title: 'Account Deleted',
        description: `The account "${selectedAccount.name}" has been deleted.`,
        variant: 'destructive'
      });
    }
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  }

  return (
    <>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>
                Manage your financial accounts.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button className="ml-auto gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{getAccountTypeLabel(account.type)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.balance)}
                    </TableCell>
                     <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(account);
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
