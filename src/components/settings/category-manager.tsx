"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useCategories } from "@/contexts/category-context"
import { Plus, Edit, Trash2, Tag, CheckSquare, Square } from "lucide-react"
import type { Category } from "@/types"

export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory, deleteCategoriesBulk, loading } = useCategories()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  })
  const [errors, setErrors] = useState<{name?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const validateForm = () => {
    const newErrors: {name?: string} = {}
    
    if (!newCategory.name.trim()) {
      newErrors.name = 'Category name is required'
    } else {
      // Check for duplicate category names (case-insensitive)
      const trimmedName = newCategory.name.trim()
      const isDuplicate = categories.some(cat => 
        cat.name.toLowerCase() === trimmedName.toLowerCase() && 
        cat.type === newCategory.type
      )
      
      if (isDuplicate) {
        newErrors.name = `A ${newCategory.type} category with this name already exists`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddCategory = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await addCategory({
        name: newCategory.name.trim(),
        type: newCategory.type
      })
      
      setNewCategory({ name: '', type: 'expense' })
      setErrors({})
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding category:', error)
      setErrors({ name: 'Failed to create category. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateUpdateForm = (category: Category) => {
    if (!category.name.trim()) return false
    
    // Check for duplicate category names (case-insensitive) excluding current category
    const trimmedName = category.name.trim()
    const isDuplicate = categories.some(cat => 
      cat.id !== category.id && 
      cat.name.toLowerCase() === trimmedName.toLowerCase() && 
      cat.type === category.type
    )
    
    return !isDuplicate
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return

    // Validate for duplicates before updating
    if (!validateUpdateForm(editingCategory)) {
      // You could show an error message here if needed
      console.error('Category name already exists')
      return
    }

    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        type: editingCategory.type
      })
      
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await deleteCategoriesBulk(Array.from(selectedCategories))
      setSelectedCategories(new Set())
      setIsBulkDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting categories:', error)
    }
  }

  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const selectAllCategories = (categoryList: Category[]) => {
    const allIds = new Set(categoryList.map(cat => cat.id))
    setSelectedCategories(allIds)
  }

  const clearSelection = () => {
    setSelectedCategories(new Set())
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage your income and expense categories
          </p>
        </div>
        <div className="flex gap-2">
          {selectedCategories.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={clearSelection}
                className="w-full sm:w-auto"
              >
                Clear Selection ({selectedCategories.size})
              </Button>
              <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Categories</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedCategories.size} selected categories? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete {selectedCategories.size} Categories
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category for your transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory({...newCategory, name: e.target.value})
                      if (errors.name) setErrors({...errors, name: undefined})
                    }}
                    placeholder="Enter category name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="category-type">Type</Label>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value: 'income' | 'expense') => setNewCategory({...newCategory, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false)
                  setErrors({})
                  setNewCategory({ name: '', type: 'expense' })
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCategory}
                  disabled={isSubmitting || !newCategory.name.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <Tag className="h-5 w-5" />
                <CardTitle>Income Categories</CardTitle>
              </div>
              {incomeCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectAllCategories(incomeCategories)}
                  className="text-xs"
                >
                  Select All
                </Button>
              )}
            </div>
            <CardDescription>
              Categories for your income sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No income categories yet
              </p>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategorySelection(category.id)}
                        className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        {selectedCategories.has(category.id) ? (
                          <CheckSquare className="h-4 w-4 text-green-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
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
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Tag className="h-5 w-5" />
                <CardTitle>Expense Categories</CardTitle>
              </div>
              {expenseCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectAllCategories(expenseCategories)}
                  className="text-xs"
                >
                  Select All
                </Button>
              )}
            </div>
            <CardDescription>
              Categories for your expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expense categories yet
              </p>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategorySelection(category.id)}
                        className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        {selectedCategories.has(category.id) ? (
                          <CheckSquare className="h-4 w-4 text-red-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
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
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-type">Type</Label>
                <Select
                  value={editingCategory.type}
                  onValueChange={(value: 'income' | 'expense') => setEditingCategory({...editingCategory, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}