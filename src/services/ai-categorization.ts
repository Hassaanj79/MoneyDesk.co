import { Transaction } from '@/types';

// AI-powered transaction categorization service
export class AICategorizationService {
  private static instance: AICategorizationService;
  private categoryPatterns: Map<string, string[]> = new Map();
  private merchantPatterns: Map<string, string> = new Map();

  private constructor() {
    this.initializePatterns();
  }

  public static getInstance(): AICategorizationService {
    if (!AICategorizationService.instance) {
      AICategorizationService.instance = new AICategorizationService();
    }
    return AICategorizationService.instance;
  }

  private initializePatterns() {
    // Food & Dining patterns
    this.categoryPatterns.set('Food & Dining', [
      'restaurant', 'cafe', 'coffee', 'food', 'dining', 'eat', 'meal', 'lunch', 'dinner', 'breakfast',
      'pizza', 'burger', 'sandwich', 'pasta', 'chinese', 'indian', 'mexican', 'italian', 'fast food',
      'delivery', 'takeout', 'grubhub', 'ubereats', 'doordash', 'starbucks', 'mcdonalds', 'kfc',
      'subway', 'dominos', 'papa johns', 'chipotle', 'taco bell', 'wendys', 'burger king'
    ]);

    // Transportation patterns
    this.categoryPatterns.set('Transportation', [
      'gas', 'fuel', 'petrol', 'diesel', 'shell', 'bp', 'exxon', 'chevron', 'mobil',
      'uber', 'lyft', 'taxi', 'cab', 'metro', 'bus', 'train', 'subway', 'parking',
      'toll', 'highway', 'bridge', 'ferry', 'airline', 'flight', 'airport', 'car rental',
      'auto', 'vehicle', 'maintenance', 'repair', 'oil change', 'tire', 'brake'
    ]);

    // Shopping patterns
    this.categoryPatterns.set('Shopping', [
      'amazon', 'walmart', 'target', 'costco', 'sams club', 'best buy', 'home depot',
      'lowes', 'macy', 'nordstrom', 'gap', 'old navy', 'h&m', 'zara', 'uniqlo',
      'ebay', 'etsy', 'shopify', 'online', 'store', 'mall', 'retail', 'purchase',
      'clothing', 'shoes', 'electronics', 'furniture', 'home', 'garden', 'tools'
    ]);

    // Entertainment patterns
    this.categoryPatterns.set('Entertainment', [
      'netflix', 'spotify', 'apple music', 'youtube', 'hulu', 'disney', 'hbo', 'prime',
      'movie', 'cinema', 'theater', 'concert', 'show', 'ticket', 'event', 'game',
      'playstation', 'xbox', 'nintendo', 'steam', 'gaming', 'arcade', 'bowling',
      'golf', 'tennis', 'gym', 'fitness', 'sport', 'recreation', 'leisure'
    ]);

    // Healthcare patterns
    this.categoryPatterns.set('Healthcare', [
      'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'cvs', 'walgreens',
      'prescription', 'medicine', 'drug', 'health', 'dental', 'dentist', 'eye',
      'vision', 'glasses', 'contact', 'therapy', 'treatment', 'insurance', 'copay'
    ]);

    // Utilities patterns
    this.categoryPatterns.set('Utilities', [
      'electric', 'gas', 'water', 'sewer', 'trash', 'waste', 'internet', 'phone',
      'cable', 'tv', 'streaming', 'utility', 'bill', 'service', 'maintenance',
      'repair', 'heating', 'cooling', 'ac', 'hvac', 'plumbing', 'electrician'
    ]);

    // Income patterns
    this.categoryPatterns.set('Income', [
      'salary', 'wage', 'pay', 'bonus', 'commission', 'freelance', 'contract',
      'refund', 'rebate', 'cashback', 'dividend', 'interest', 'investment',
      'rental', 'royalty', 'gift', 'inheritance', 'lottery', 'prize', 'win'
    ]);

    // Initialize merchant patterns
    this.merchantPatterns.set('amazon', 'Shopping');
    this.merchantPatterns.set('walmart', 'Shopping');
    this.merchantPatterns.set('target', 'Shopping');
    this.merchantPatterns.set('starbucks', 'Food & Dining');
    this.merchantPatterns.set('mcdonalds', 'Food & Dining');
    this.merchantPatterns.set('uber', 'Transportation');
    this.merchantPatterns.set('lyft', 'Transportation');
    this.merchantPatterns.set('netflix', 'Entertainment');
    this.merchantPatterns.set('spotify', 'Entertainment');
  }

  /**
   * Categorize a transaction using AI-powered pattern matching
   */
  public categorizeTransaction(transaction: Partial<Transaction>): string | null {
    if (!transaction.name || !transaction.amount) {
      return null;
    }

    const transactionName = transaction.name.toLowerCase();
    const amount = Math.abs(transaction.amount);

    // First, check merchant patterns for exact matches
    for (const [merchant, category] of this.merchantPatterns) {
      if (transactionName.includes(merchant)) {
        return category;
      }
    }

    // Then, check category patterns
    for (const [category, patterns] of this.categoryPatterns) {
      for (const pattern of patterns) {
        if (transactionName.includes(pattern)) {
          return category;
        }
      }
    }

    // Amount-based categorization for common patterns
    if (transaction.type === 'expense') {
      // Small amounts are likely food/coffee
      if (amount < 20) {
        return 'Food & Dining';
      }
      // Medium amounts could be various categories
      else if (amount < 100) {
        return 'Shopping';
      }
      // Large amounts are likely major purchases
      else if (amount > 500) {
        return 'Shopping';
      }
    }

    return null;
  }

  /**
   * Get confidence score for categorization (0-1)
   */
  public getCategorizationConfidence(transaction: Partial<Transaction>): number {
    if (!transaction.name) return 0;

    const transactionName = transaction.name.toLowerCase();
    let maxConfidence = 0;

    // Check merchant patterns (highest confidence)
    for (const [merchant, category] of this.merchantPatterns) {
      if (transactionName.includes(merchant)) {
        return 0.95; // Very high confidence for known merchants
      }
    }

    // Check category patterns
    for (const [category, patterns] of this.categoryPatterns) {
      for (const pattern of patterns) {
        if (transactionName.includes(pattern)) {
          const confidence = Math.min(0.9, pattern.length / transactionName.length);
          maxConfidence = Math.max(maxConfidence, confidence);
        }
      }
    }

    return maxConfidence;
  }

  /**
   * Suggest categories for a transaction
   */
  public suggestCategories(transaction: Partial<Transaction>): Array<{category: string, confidence: number}> {
    if (!transaction.name) return [];

    const suggestions: Array<{category: string, confidence: number}> = [];
    const transactionName = transaction.name.toLowerCase();

    for (const [category, patterns] of this.categoryPatterns) {
      let confidence = 0;
      let matchCount = 0;

      for (const pattern of patterns) {
        if (transactionName.includes(pattern)) {
          matchCount++;
          confidence += pattern.length / transactionName.length;
        }
      }

      if (matchCount > 0) {
        confidence = Math.min(0.9, confidence / matchCount);
        suggestions.push({ category, confidence });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Learn from user's categorization choices
   */
  public learnFromUser(transactionName: string, category: string) {
    const name = transactionName.toLowerCase();
    
    // Add to merchant patterns if it's a specific merchant
    if (this.isMerchantName(name)) {
      this.merchantPatterns.set(name, category);
    } else {
      // Add to category patterns
      const existingPatterns = this.categoryPatterns.get(category) || [];
      if (!existingPatterns.includes(name)) {
        existingPatterns.push(name);
        this.categoryPatterns.set(category, existingPatterns);
      }
    }
  }

  private isMerchantName(name: string): boolean {
    // Simple heuristic to determine if it's a merchant name
    return name.length > 3 && !name.includes(' ') && /^[a-zA-Z]+$/.test(name);
  }
}

// Export singleton instance
export const aiCategorization = AICategorizationService.getInstance();
