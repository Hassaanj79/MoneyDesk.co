import { useState, useCallback } from 'react';
import { useCategories } from '@/contexts/category-context';

interface CategorySuggestion {
  name: string;
  confidence: number;
  isExisting: boolean;
  categoryId?: string;
}

interface CategorySuggestionResponse {
  suggestions: CategorySuggestion[];
  newCategories: string[];
}

export const useCategorySuggestions = () => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategories();

  const getSuggestions = useCallback(async (
    transactionName: string,
    transactionType: 'income' | 'expense'
  ) => {
    if (!transactionName.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/category-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionName,
          transactionType,
          existingCategories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data: CategorySuggestionResponse = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error getting category suggestions:', err);
      setError('Failed to get category suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
    clearSuggestions
  };
};