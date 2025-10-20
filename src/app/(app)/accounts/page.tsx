

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
      try {
        await deleteAccount(selectedAccount.id, transactions);
        // addNotification({
        //   type: 'account_deleted',
        //   title: 'Account Deleted',
        //   message: `The account "${selectedAccount.name}" has been deleted.`,
        //   navigationPath: '/accounts'
        // });
      } catch (error) {
        // Error is already handled by the context (toast message shown)
        console.error('Error deleting account:', error);
      }
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
              <div>
                {/* Information Banner */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">i</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                        Account Deletion Policy
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Accounts with associated transactions cannot be deleted to maintain data integrity. 
                        To delete an account, first delete or reassign all its transactions from the Transactions page.
                      </p>
                    </div>
                  </div>
                </div>
                
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
                          {(() => {
                            const accountTransactions = transactions.filter(t => t.accountId === account.id);
                            const hasTransactions = accountTransactions.length > 0;
                            
                            return hasTransactions ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={`Cannot delete account with ${accountTransactions.length} transaction${accountTransactions.length === 1 ? '' : 's'}. Delete or reassign transactions first.`}
                                disabled
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(account);
                                }}
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                                title="Delete account"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
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
            <AlertDialogTitle>
              {selectedAccount && transactions.filter(t => t.accountId === selectedAccount.id).length > 0 
                ? '🔒 Account Cannot Be Deleted' 
                : 'Are you sure?'
              }
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedAccount && transactions.filter(t => t.accountId === selectedAccount.id).length > 0 ? (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Why can't I delete this account?
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      The account <strong>"{selectedAccount.name}"</strong> has <strong>{transactions.filter(t => t.accountId === selectedAccount.id).length} transaction{transactions.filter(t => t.accountId === selectedAccount.id).length === 1 ? '' : 's'}</strong> associated with it. 
                      Deleting this account would create data inconsistencies and potentially lose important financial records.
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      How to delete this account:
                    </p>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Go to the <strong>Transactions</strong> page</li>
                      <li>Filter by this account or search for transactions</li>
                      <li>Delete or reassign all {transactions.filter(t => t.accountId === selectedAccount.id).length} transaction{transactions.filter(t => t.accountId === selectedAccount.id).length === 1 ? '' : 's'}</li>
                      <li>Return here to delete the account</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> You can also edit transactions to change their account assignment instead of deleting them.
                  </p>
                </>
              ) : (
                `This action cannot be undone and will permanently remove the account "${selectedAccount?.name}" from your financial records.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {selectedAccount && transactions.filter(t => t.accountId === selectedAccount.id).length === 0 && (
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete Account
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
