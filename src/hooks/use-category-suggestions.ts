import { useState, useCallback } from 'react';

export interface CategorySuggestion {
  name: string;
  confidence: number;
  reason: string;
}

export interface CategorySuggestionsResponse {
  suggestions: CategorySuggestion[];
  aiPowered?: boolean;
  fallback?: boolean;
  error?: string;
}

export function useCategorySuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = useCallback(async (
    description: string,
    type: 'income' | 'expense',
    existingCategories: string[] = []
  ): Promise<CategorySuggestion[]> => {
    if (!description.trim()) {
      return [];
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
          description: description.trim(),
          type,
          existingCategories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get category suggestions');
      }

      const data: CategorySuggestionsResponse = await response.json();
      return data.suggestions || [];
    } catch (err) {
      console.error('Error getting category suggestions:', err);
      // Don't set error state for fallback suggestions - they should work silently
      setError(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getSuggestions,
    loading,
    error,
  };
}
