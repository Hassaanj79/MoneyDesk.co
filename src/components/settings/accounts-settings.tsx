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
import { useTransactions } from "@/contexts/transaction-context"
import { useCurrency } from "@/hooks/use-currency"
import { Plus, Edit, Trash2, CreditCard, Wallet, Building2, RefreshCw, BarChart3 } from "lucide-react"
import { AccountBreakdown } from "@/components/accounts/account-breakdown"
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
  const { transactions, recalculateAllAccountBalances } = useTransactions()
  const { formatCurrency } = useCurrency()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank' as Account['type'],
    initialBalance: undefined as number | undefined
  })
  const [errors, setErrors] = useState<{name?: string, initialBalance?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [breakdownAccount, setBreakdownAccount] = useState<Account | null>(null)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  const validateForm = () => {
    const newErrors: {name?: string, initialBalance?: string} = {}
    
    if (!newAccount.name.trim()) {
      newErrors.name = 'Account name is required'
    } else {
      // Check for duplicate account names (case-insensitive)
      const trimmedName = newAccount.name.trim()
      const isDuplicate = accounts.some(account => 
        account.name.toLowerCase() === trimmedName.toLowerCase()
      )
      
      if (isDuplicate) {
        newErrors.name = 'An account with this name already exists'
      }
    }
    
    if (newAccount.initialBalance !== undefined && isNaN(newAccount.initialBalance)) {
      newErrors.initialBalance = 'Initial balance must be a valid number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddAccount = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await addAccount({
        name: newAccount.name.trim(),
        type: newAccount.type,
        initialBalance: newAccount.initialBalance || 0
      })
      
      setNewAccount({ name: '', type: 'bank', initialBalance: undefined })
      setErrors({})
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding account:', error)
      setErrors({ name: 'Failed to create account. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateUpdateForm = (account: Account) => {
    if (!account.name.trim()) return false
    
    // Check for duplicate account names (case-insensitive) excluding current account
    const trimmedName = account.name.trim()
    const isDuplicate = accounts.some(acc => 
      acc.id !== account.id && 
      acc.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    return !isDuplicate
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount || !editingAccount.name.trim()) return

    // Validate for duplicates before updating
    if (!validateUpdateForm(editingAccount)) {
      // You could show an error message here if needed
      console.error('Account name already exists')
      return
    }

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
      await deleteAccount(accountId, transactions)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleRecalculateBalances = async () => {
    setIsRecalculating(true)
    try {
      await recalculateAllAccountBalances()
    } catch (error) {
      console.error('Error recalculating balances:', error)
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleViewBreakdown = (account: Account) => {
    setBreakdownAccount(account)
    setIsBreakdownOpen(true)
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRecalculateBalances}
            disabled={isRecalculating}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate Balances'}
          </Button>
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
            <div className="space-y-6">
              <div>
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={newAccount.name}
                  onChange={(e) => {
                    setNewAccount({...newAccount, name: e.target.value})
                    if (errors.name) setErrors({...errors, name: undefined})
                  }}
                  placeholder="Enter account name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
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
                  type="text"
                  value={newAccount.initialBalance || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers, decimal point, and minus sign
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      setNewAccount({...newAccount, initialBalance: value === '' ? undefined : parseFloat(value) || 0})
                      if (errors.initialBalance) setErrors({...errors, initialBalance: undefined})
                    }
                  }}
                  placeholder="Enter initial balance (can be negative)"
                  className={errors.initialBalance ? 'border-red-500' : ''}
                />
                {errors.initialBalance && <p className="text-sm text-red-500 mt-1">{errors.initialBalance}</p>}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false)
                setErrors({})
                setNewAccount({ name: '', type: 'bank', initialBalance: undefined })
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddAccount}
                disabled={isSubmitting || !newAccount.name.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Add Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
              <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Accounts Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 px-4">
                Add your first account to start tracking your finances
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const IconComponent = getAccountIcon(account.type)
            const accountTransactions = transactions.filter(t => t.accountId === account.id)
            const hasTransactions = accountTransactions.length > 0
            return (
              <Card key={account.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                      onClick={() => handleViewBreakdown(account)}
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{account.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div 
                      className="text-right flex-1 min-w-0"
                      onClick={() => handleViewBreakdown(account)}
                    >
                      <p className="font-semibold text-sm sm:text-base truncate">
                        {formatCurrency(account.balance || 0)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Current Balance</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBreakdown(account)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        title="View breakdown"
                      >
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingAccount(account)
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit account"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${hasTransactions 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-700'
                            }`}
                            title={hasTransactions 
                              ? `Cannot delete account with ${accountTransactions.length} transaction${accountTransactions.length === 1 ? '' : 's'}` 
                              : 'Delete account'
                            }
                            disabled={hasTransactions}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              {hasTransactions 
                                ? `Cannot delete "${account.name}" because it has ${accountTransactions.length} associated transaction${accountTransactions.length === 1 ? '' : 's'}. Please delete or reassign these transactions first.`
                                : `Are you sure you want to delete "${account.name}"? This action cannot be undone.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {!hasTransactions && (
                              <AlertDialogAction
                                onClick={() => handleDeleteAccount(account.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            )}
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
            <div className="space-y-6">
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
                  type="text"
                  value={editingAccount.initialBalance || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers, decimal point, and minus sign
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      setEditingAccount({...editingAccount, initialBalance: value === '' ? undefined : parseFloat(value) || 0})
                    }
                  }}
                  placeholder="Enter initial balance (can be negative)"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount}>
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Breakdown Dialog */}
      {breakdownAccount && (
        <AccountBreakdown
          account={breakdownAccount}
          isOpen={isBreakdownOpen}
          onClose={() => {
            setIsBreakdownOpen(false)
            setBreakdownAccount(null)
          }}
        />
      )}
    </div>
  )
}
