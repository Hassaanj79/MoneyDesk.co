"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { useCategorySuggestions, CategorySuggestion } from '@/hooks/use-category-suggestions';

interface CategorySuggestionsProps {
  description: string;
  type: 'income' | 'expense';
  existingCategories: string[];
  onSelectCategory: (categoryName: string) => void;
  onAddNewCategory: (categoryName: string) => void;
  disabled?: boolean;
  resetTrigger?: number; // Add reset trigger to clear suggestions
}

export function CategorySuggestions({
  description,
  type,
  existingCategories,
  onSelectCategory,
  onAddNewCategory,
  disabled = false,
  resetTrigger
}: CategorySuggestionsProps) {
  const { getSuggestions, loading, error } = useCategorySuggestions();
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset suggestions when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [resetTrigger]);

  // Debounce the API call
  useEffect(() => {
    if (!description.trim() || description.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const newSuggestions = await getSuggestions(description, type, existingCategories);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [description, type, existingCategories, getSuggestions]);

  const handleSelectCategory = (suggestion: CategorySuggestion) => {
    onSelectCategory(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions immediately
  };

  const handleAddNewCategory = (suggestion: CategorySuggestion) => {
    onAddNewCategory(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions immediately
  };

  if (disabled || !showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            AI Category Suggestions
          </span>
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
            {error}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{suggestion.name}</span>
                    <Badge 
                      variant={suggestion.confidence >= 80 ? 'default' : suggestion.confidence >= 60 ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {suggestion.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {suggestion.reason}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectCategory(suggestion)}
                    className="h-7 px-2 text-xs"
                  >
                    Use
                  </Button>
                  {!existingCategories.includes(suggestion.name) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddNewCategory(suggestion)}
                      className="h-7 px-2 text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {suggestions.length === 0 && !loading && description.length >= 3 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No suggestions available for this description.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
