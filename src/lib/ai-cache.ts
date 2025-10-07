// Simple in-memory cache for AI insights
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class AICache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for financial insights
  generateKey(userId: string, dateRange: { from: string; to: string }, currency: string, transactionHash?: string): string {
    const baseKey = `ai-insights:${userId}:${dateRange.from}:${dateRange.to}:${currency}`;
    return transactionHash ? `${baseKey}:${transactionHash}` : baseKey;
  }

  // Generate cache key for category suggestions
  generateCategoryKey(description: string, type: string, existingCategories: string[]): string {
    const categoriesHash = existingCategories.sort().join(',');
    return `category-suggestions:${description}:${type}:${categoriesHash}`;
  }

  // Clear cache for a specific user
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`:${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const aiCache = new AICache();
