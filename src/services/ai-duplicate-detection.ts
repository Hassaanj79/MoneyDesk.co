import { Transaction } from '@/types';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number;
  similarTransaction?: Transaction;
  reasons: string[];
}

export class AIDuplicateDetectionService {
  private static instance: AIDuplicateDetectionService;

  private constructor() {}

  public static getInstance(): AIDuplicateDetectionService {
    if (!AIDuplicateDetectionService.instance) {
      AIDuplicateDetectionService.instance = new AIDuplicateDetectionService();
    }
    return AIDuplicateDetectionService.instance;
  }

  /**
   * Detect if a transaction is a duplicate
   */
  public detectDuplicate(
    newTransaction: Partial<Transaction>,
    existingTransactions: Transaction[],
    timeWindowHours: number = 24
  ): DuplicateDetectionResult {
    const reasons: string[] = [];
    let maxConfidence = 0;
    let mostSimilarTransaction: Transaction | undefined;

    // Check if existingTransactions is valid
    if (!existingTransactions || !Array.isArray(existingTransactions)) {
      return {
        isDuplicate: false,
        confidence: 0,
        reasons: ['No existing transactions to compare against']
      };
    }

    // Filter transactions within time window
    const timeWindowMs = timeWindowHours * 60 * 60 * 1000;
    const recentTransactions = existingTransactions.filter(t => {
      if (!newTransaction.date || !t.date) return false;
      
      const newDate = new Date(newTransaction.date);
      const existingDate = new Date(t.date);
      const timeDiff = Math.abs(newDate.getTime() - existingDate.getTime());
      
      return timeDiff <= timeWindowMs;
    });

    for (const existingTransaction of recentTransactions) {
      const similarity = this.calculateSimilarity(newTransaction, existingTransaction);
      
      if (similarity > maxConfidence) {
        maxConfidence = similarity;
        mostSimilarTransaction = existingTransaction;
      }
    }

    // Determine if it's a duplicate based on confidence threshold
    const isDuplicate = maxConfidence > 0.8;

    if (isDuplicate && mostSimilarTransaction) {
      reasons.push(`Similar transaction found: ${mostSimilarTransaction.name}`);
      reasons.push(`Amount difference: ${Math.abs((newTransaction.amount || 0) - mostSimilarTransaction.amount)}`);
      reasons.push(`Time difference: ${this.getTimeDifference(newTransaction.date, mostSimilarTransaction.date)}`);
    }

    return {
      isDuplicate,
      confidence: maxConfidence,
      similarTransaction: mostSimilarTransaction,
      reasons
    };
  }

  /**
   * Calculate similarity between two transactions
   */
  private calculateSimilarity(
    transaction1: Partial<Transaction>,
    transaction2: Transaction
  ): number {
    let similarity = 0;
    let factors = 0;

    // Amount similarity (40% weight)
    if (transaction1.amount && transaction2.amount) {
      const amountDiff = Math.abs(transaction1.amount - transaction2.amount);
      const amountSimilarity = Math.max(0, 1 - (amountDiff / Math.max(transaction1.amount, transaction2.amount)));
      similarity += amountSimilarity * 0.4;
      factors += 0.4;
    }

    // Name similarity (30% weight)
    if (transaction1.name && transaction2.name) {
      const nameSimilarity = this.calculateStringSimilarity(
        transaction1.name.toLowerCase(),
        transaction2.name.toLowerCase()
      );
      similarity += nameSimilarity * 0.3;
      factors += 0.3;
    }

    // Account similarity (20% weight)
    if (transaction1.accountId && transaction2.accountId) {
      const accountSimilarity = transaction1.accountId === transaction2.accountId ? 1 : 0;
      similarity += accountSimilarity * 0.2;
      factors += 0.2;
    }

    // Type similarity (10% weight)
    if (transaction1.type && transaction2.type) {
      const typeSimilarity = transaction1.type === transaction2.type ? 1 : 0;
      similarity += typeSimilarity * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get human-readable time difference
   */
  private getTimeDifference(date1?: string | Date, date2?: string | Date): string {
    if (!date1 || !date2) return 'Unknown';

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day(s)`;
    if (diffHours > 0) return `${diffHours} hour(s)`;
    return `${diffMinutes} minute(s)`;
  }

  /**
   * Get potential duplicates from a list of transactions
   */
  public findPotentialDuplicates(transactions: Transaction[]): Array<{
    transaction: Transaction;
    duplicates: Transaction[];
    confidence: number;
  }> {
    const duplicates: Array<{
      transaction: Transaction;
      duplicates: Transaction[];
      confidence: number;
    }> = [];

    // Check if transactions is valid
    if (!transactions || !Array.isArray(transactions)) {
      return duplicates;
    }

    for (let i = 0; i < transactions.length; i++) {
      const currentTransaction = transactions[i];
      const similarTransactions: Transaction[] = [];

      for (let j = i + 1; j < transactions.length; j++) {
        const otherTransaction = transactions[j];
        const similarity = this.calculateSimilarity(currentTransaction, otherTransaction);

        if (similarity > 0.7) {
          similarTransactions.push(otherTransaction);
        }
      }

      if (similarTransactions.length > 0) {
        duplicates.push({
          transaction: currentTransaction,
          duplicates: similarTransactions,
          confidence: Math.max(...similarTransactions.map(t => 
            this.calculateSimilarity(currentTransaction, t)
          ))
        });
      }
    }

    return duplicates;
  }
}

// Export singleton instance
export const aiDuplicateDetection = AIDuplicateDetectionService.getInstance();
