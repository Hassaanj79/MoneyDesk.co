"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Check, Plus, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategorySuggestions } from '@/hooks/use-category-suggestions';
import { useCategories } from '@/contexts/category-context';
import { useToast } from '@/hooks/use-toast';

interface SmartCategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  transactionType: 'income' | 'expense';
  transactionName: string;
  className?: string;
  onFormUpdate?: (categoryId: string) => void;
}

export const SmartCategorySelector: React.FC<SmartCategorySelectorProps> = ({
  value,
  onChange,
  transactionType,
  transactionName,
  className = '',
  onFormUpdate
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { suggestions, loading, getSuggestions, clearSuggestions } = useCategorySuggestions();
  const { categories, addCategory } = useCategories();
  const { toast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (transactionName.trim() && transactionName.length > 2) {
      debounceRef.current = setTimeout(() => {
        getSuggestions(transactionName, transactionType);
        // Don't auto-show suggestions, let user toggle them
      }, 500);
    } else {
      clearSuggestions();
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [transactionName, transactionType, getSuggestions, clearSuggestions]);

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.isExisting && suggestion.categoryId) {
      onChange(suggestion.categoryId);
      setShowSuggestions(false);
    } else {
      // Show create form for new category
      setNewCategoryName(suggestion.name);
      setShowCreateForm(true);
    }
  };

  const handleManualCategorySelect = (categoryId: string) => {
    onChange(categoryId);
    setShowManualDropdown(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        type: transactionType,
        color: '#3B82F6' // Default blue color
      });
      
      // Ensure the category is selected immediately
      onChange(newCategory.id);
      
      // Also call onFormUpdate if provided (for additional form updates)
      if (onFormUpdate) {
        onFormUpdate(newCategory.id);
      }
      
      setShowCreateForm(false);
      setNewCategoryName('');
      setShowSuggestions(false);
      
      toast({
        title: "Category Created",
        description: `"${newCategoryName}" has been added and selected.`,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getSelectedCategoryName = () => {
    const selectedCategory = categories.find(cat => cat.id === value);
    return selectedCategory?.name || '';
  };

  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="category">Category</Label>
      
      {/* Manual Category Selection */}
      <div className="space-y-2">
        <Select value={value} onValueChange={handleManualCategorySelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* AI Suggestions Toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {showSuggestions ? 'Hide' : 'Show'} AI Suggestions
          </Button>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && (
        <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </div>
          
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-background border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.name}</span>
                    <Badge 
                      variant={suggestion.isExisting ? "default" : "outline"}
                      className="text-xs"
                    >
                      {suggestion.isExisting ? "Existing" : "New"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}% match
                    </span>
                  </div>
                  
                  {suggestion.isExisting ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              {loading ? 'Getting AI suggestions...' : 'Type a transaction name above to get AI suggestions'}
            </div>
          )}
        </div>
      )}

      {/* Create New Category Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Plus className="h-4 w-4" />
            Create New Category
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1"
            />
            
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
              size="sm"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewCategoryName('');
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        Select a category from the dropdown above, or use AI suggestions for smart categorization.
      </div>
    </div>
  );
};
