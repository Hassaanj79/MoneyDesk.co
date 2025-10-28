import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { MoneyPool, ROSCAConfig, ROSCAPeriod } from '@/types';

/**
 * Calculate rotation order for ROSCA pool
 */
export function calculateRotationOrder(
  memberCount: number,
  rotationMode: 'fixed_order' | 'ballot_draw'
): string[] {
  const order: string[] = [];
  
  if (rotationMode === 'ballot_draw') {
    // Generate random order using Fisher-Yates shuffle
    for (let i = 0; i < memberCount; i++) {
      order.push(i.toString());
    }
    
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } else {
    // Fixed order: 0, 1, 2, 3, ...
    for (let i = 0; i < memberCount; i++) {
      order.push(i.toString());
    }
  }
  
  return order;
}

/**
 * Initialize ROSCA periods based on rotation order
 */
export function initializeROSCAPeriods(
  roscaConfig: ROSCAConfig,
  participantIds: string[]
): ROSCAPeriod[] {
  const periods: ROSCAPeriod[] = [];
  const potAmount = roscaConfig.contributionAmount * roscaConfig.memberLimit;
  const startDate = new Date(roscaConfig.startDate);
  
  // Get rotation order
  const rotationOrder = roscaConfig.rotationOrder || 
    calculateRotationOrder(roscaConfig.memberLimit, roscaConfig.rotationMode);
  
  // Create one period per member
  for (let i = 0; i < roscaConfig.memberLimit; i++) {
    const periodIndex = i + 1;
    const payoutDate = new Date(startDate);
    
    // Calculate payout date based on frequency
    if (roscaConfig.frequency === 'monthly') {
      payoutDate.setMonth(payoutDate.getMonth() + i);
    } else if (roscaConfig.frequency === 'weekly') {
      payoutDate.setDate(payoutDate.getDate() + (i * 7));
    }
    
    const dueDate = new Date(payoutDate);
    dueDate.setDate(dueDate.getDate() - 2); // Due 2 days before payout
    
    periods.push({
      periodIndex,
      dueDate: dueDate.toISOString(),
      payoutDate: payoutDate.toISOString(),
      payoutTo: participantIds[parseInt(rotationOrder[i])] || '',
      payoutAmount: potAmount,
      contributions: [],
      payoutComplete: false,
    });
  }
  
  return periods;
}

/**
 * Get next period for ROSCA pool
 */
export function getNextPeriod(pool: MoneyPool): ROSCAPeriod | null {
  if (!pool.roscaConfig || !pool.roscaConfig.periods) {
    return null;
  }
  
  const nextPeriod = pool.roscaConfig.periods.find(
    period => !period.payoutComplete && 
    new Date(period.dueDate) >= new Date()
  );
  
  return nextPeriod || null;
}

/**
 * Get current period index
 */
export function getCurrentPeriodIndex(pool: MoneyPool): number {
  return pool.roscaConfig?.currentPeriod || 0;
}

/**
 * Check if period contributions are complete
 */
export function isPeriodComplete(period: ROSCAPeriod, memberCount: number): boolean {
  return period.contributions.length === memberCount &&
         period.contributions.every(c => c.amountPaid > 0);
}

/**
 * Calculate member's total contribution
 */
export function calculateMemberContribution(
  pool: MoneyPool,
  memberId: string
): number {
  if (!pool.roscaConfig?.periods) return 0;
  
  let total = 0;
  for (const period of pool.roscaConfig.periods) {
    const memberContribution = period.contributions.find(c => c.memberId === memberId);
    if (memberContribution) {
      total += memberContribution.amountPaid;
    }
  }
  
  return total;
}

/**
 * Calculate member's total payout
 */
export function calculateMemberPayout(pool: MoneyPool, memberId: string): number {
  if (!pool.roscaConfig?.periods) return 0;
  
  const periods = pool.roscaConfig.periods.filter(p => p.payoutTo === memberId && p.payoutComplete);
  return periods.length > 0 ? periods[0].payoutAmount : 0;
}

/**
 * Get member's net position
 */
export function calculateMemberNetPosition(pool: MoneyPool, memberId: string): number {
  return calculateMemberContribution(pool, memberId) - calculateMemberPayout(pool, memberId);
}

