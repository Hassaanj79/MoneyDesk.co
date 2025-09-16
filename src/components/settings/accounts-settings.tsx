"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAccounts } from "@/contexts/account-context"
import { useCurrency } from "@/hooks/use-currency"
import { Plus, Edit, Trash2, CreditCard, Wallet, Building2 } from "lucide-react"
import type { Account } from "@/types"

const accountTypes = [
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'debit-card', label: 'Debit Card', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', icon: Wallet },
  { value: 'zelle', label: 'Zelle', icon: Wallet },
  { value: 'cash-app', label: 'Cash App', icon: Wallet },
  { value: 'custom', label: 'Custom', icon: Wallet },
]

export function AccountsSettings() {
  const { accounts, addAccount, updateAccount, deleteAccount, loading } = useAccounts()
  const { formatCurrency } = useCurrency()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank' as Account['type'],
    initialBalance: 0
  })

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) return

    try {
      await addAccount({
        name: newAccount.name.trim(),
        type: newAccount.type,
        initialBalance: newAccount.initialBalance
      })
      
      setNewAccount({ name: '', type: 'bank', initialBalance: 0 })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount || !editingAccount.name.trim()) return

    try {
      await updateAccount(editingAccount.id, {
        name: editingAccount.name.trim(),
        type: editingAccount.type,
        initialBalance: editingAccount.initialBalance
      })
      
      setEditingAccount(null)
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const getAccountIcon = (type: Account['type']) => {
    const accountType = accountTypes.find(t => t.value === type)
    return accountType ? accountType.icon : Wallet
  }

  const getAccountTypeLabel = (type: Account['type']) => {
    const accountType = accountTypes.find(t => t.value === type)
    return accountType ? accountType.label : 'Custom'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your financial accounts and their balances
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new financial account to track your money
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(value: Account['type']) => setNewAccount({...newAccount, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="initial-balance">Initial Balance</Label>
                <Input
                  id="initial-balance"
                  type="number"
                  step="0.01"
                  value={newAccount.initialBalance}
                  onChange={(e) => setNewAccount({...newAccount, initialBalance: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAccount}>
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Add your first account to start tracking your finances
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const IconComponent = getAccountIcon(account.type)
            return (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{account.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(account.balance || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{account.name}"? This action cannot be undone and will remove all associated transactions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account details
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-account-name">Account Name</Label>
                <Input
                  id="edit-account-name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <Label htmlFor="edit-account-type">Account Type</Label>
                <Select
                  value={editingAccount.type}
                  onValueChange={(value: Account['type']) => setEditingAccount({...editingAccount, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-initial-balance">Initial Balance</Label>
                <Input
                  id="edit-initial-balance"
                  type="number"
                  step="0.01"
                  value={editingAccount.initialBalance}
                  onChange={(e) => setEditingAccount({...editingAccount, initialBalance: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount}>
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
