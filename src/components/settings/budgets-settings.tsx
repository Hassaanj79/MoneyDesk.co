"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useBudgets } from "@/contexts/budget-context"
import { useCategories } from "@/contexts/category-context"
import { useTransactions } from "@/contexts/transaction-context"
import { Plus, Edit, Trash2, Target, Calendar, DollarSign } from "lucide-react"
import type { Budget } from "@/types"
import { calculateBudgetProgress, getBudgetStatus } from "@/lib/budget-utils"

const budgetPeriods = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function BudgetsSettings() {
  const { budgets, addBudget, updateBudget, deleteBudget, loading: budgetsLoading } = useBudgets()
  const { categories, loading: categoriesLoading } = useCategories()
  const { transactions } = useTransactions()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: 0,
    period: 'monthly' as Budget['period'],
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const handleAddBudget = async () => {
    if (!newBudget.name.trim() || !newBudget.categoryId || newBudget.amount <= 0) return

    try {
      await addBudget({
        name: newBudget.name.trim(),
        amount: newBudget.amount,
        period: newBudget.period,
        categoryId: newBudget.categoryId,
        startDate: new Date(newBudget.startDate),
        endDate: new Date(newBudget.endDate)
      })
      
      setNewBudget({
        name: '',
        amount: 0,
        period: 'monthly',
        categoryId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding budget:', error)
    }
  }

  const handleUpdateBudget = async () => {
    if (!editingBudget || !editingBudget.name || !editingBudget.name.trim() || !editingBudget.categoryId || editingBudget.amount <= 0) return

    try {
      const updateData: Partial<Omit<Budget, 'id' | 'userId'>> = {
        name: editingBudget.name.trim(),
        amount: editingBudget.amount,
        categoryId: editingBudget.categoryId,
      };

      // Only include fields that are defined
      if (editingBudget.period) {
        updateData.period = editingBudget.period;
      }
      if (editingBudget.startDate) {
        updateData.startDate = editingBudget.startDate;
      }
      if (editingBudget.endDate) {
        updateData.endDate = editingBudget.endDate;
      }

      await updateBudget(editingBudget.id, updateData)
      
      setEditingBudget(null)
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId)
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const getCategoryType = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.type : 'expense'
  }

  const getBudgetData = (budget: Budget) => {
    return calculateBudgetProgress(budget, transactions);
  }

  const loading = budgetsLoading || categoriesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading budgets...</p>
        </div>
      </div>
    )
  }

  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budgets</h3>
          <p className="text-sm text-muted-foreground">
            Set spending limits and track your financial goals
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
              <DialogDescription>
                Create a new budget to track your spending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-name">Budget Name</Label>
                <Input
                  id="budget-name"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  placeholder="Enter budget name"
                />
              </div>
              <div>
                <Label htmlFor="budget-amount">Budget Amount</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({...newBudget, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="budget-period">Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: Budget['period']) => setNewBudget({...newBudget, period: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget-category">Category</Label>
                <Select
                  value={newBudget.categoryId}
                  onValueChange={(value) => setNewBudget({...newBudget, categoryId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newBudget.startDate}
                    onChange={(e) => setNewBudget({...newBudget, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newBudget.endDate}
                    onChange={(e) => setNewBudget({...newBudget, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBudget}>
                Add Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Budgets Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first budget to start tracking your spending
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          budgets.map((budget) => {
            const budgetData = getBudgetData(budget)
            const { progress, spent, remaining, isOverBudget } = budgetData
            const categoryType = getCategoryType(budget.categoryId)
            const status = getBudgetStatus(progress)
            
            return (
              <Card key={budget.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryType === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{budget.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryName(budget.categoryId)} • {budget.period}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(budget.amount || 0).toFixed(2)}
                      </p>
                      <p className={`text-sm ${status.color}`}>
                        {isOverBudget ? 'Over Budget' : `$${remaining.toFixed(2)} remaining`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBudget(budget)}
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
                            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{budget.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress ({spent.toFixed(2)} / {(budget.amount || 0).toFixed(2)})</span>
                      <span className={`${status.color} font-medium`}>
                        {progress.toFixed(1)}% - {status.status}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${status.progressBarBgColor || 'bg-gray-200'}`}>
                      <div
                        className={`h-2 rounded-full transition-all ${status.progressBarColor || 'bg-purple-600'}`}
                        style={{ width: `${Math.min(progress || 0, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {budget.startDate ? (budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)).toLocaleDateString() : 'N/A'} - {budget.endDate ? (budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate)).toLocaleDateString() : 'N/A'}
                      </span>
                      <span>
                        ${spent.toFixed(2)} spent
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update the budget details
            </DialogDescription>
          </DialogHeader>
          {editingBudget && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-budget-name">Budget Name</Label>
                <Input
                  id="edit-budget-name"
                  value={editingBudget.name || ''}
                  onChange={(e) => setEditingBudget({...editingBudget, name: e.target.value})}
                  placeholder="Enter budget name"
                />
              </div>
              <div>
                <Label htmlFor="edit-budget-amount">Budget Amount</Label>
                <Input
                  id="edit-budget-amount"
                  type="number"
                  step="0.01"
                  value={editingBudget.amount || 0}
                  onChange={(e) => setEditingBudget({...editingBudget, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-budget-period">Period</Label>
                <Select
                  value={editingBudget.period}
                  onValueChange={(value: Budget['period']) => setEditingBudget({...editingBudget, period: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-budget-category">Category</Label>
                <Select
                  value={editingBudget.categoryId}
                  onValueChange={(value) => setEditingBudget({...editingBudget, categoryId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingBudget.startDate ? (editingBudget.startDate instanceof Date ? editingBudget.startDate : new Date(editingBudget.startDate)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingBudget({...editingBudget, startDate: new Date(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editingBudget.endDate ? (editingBudget.endDate instanceof Date ? editingBudget.endDate : new Date(editingBudget.endDate)).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => setEditingBudget({...editingBudget, endDate: new Date(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBudget(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBudget}>
              Update Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
