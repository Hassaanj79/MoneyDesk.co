/**
 * Loan calculation utilities
 */

export interface LoanCalculation {
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;
  monthlyPayment?: number;
  totalPayments?: number;
}

/**
 * Calculate simple interest for a loan
 * Interest rate is a percentage (e.g., 5 for 5%)
 */
export function calculateSimpleInterest(
  principal: number,
  interestRate: number,
  timeInYears: number
): LoanCalculation {
  // Calculate interest as percentage of principal
  const interestAmount = (principal * interestRate / 100) * timeInYears;
  const totalAmount = principal + interestAmount;
  
  return {
    principal,
    interestRate,
    interestAmount,
    totalAmount,
  };
}

/**
 * Calculate compound interest for a loan (monthly compounding)
 */
export function calculateCompoundInterest(
  principal: number,
  annualInterestRate: number,
  timeInYears: number,
  compoundingFrequency: number = 12 // Monthly compounding
): LoanCalculation {
  const ratePerPeriod = annualInterestRate / (100 * compoundingFrequency);
  const totalPeriods = timeInYears * compoundingFrequency;
  
  const totalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods);
  const interestAmount = totalAmount - principal;
  
  return {
    principal,
    interestRate: annualInterestRate,
    interestAmount,
    totalAmount,
  };
}

/**
 * Calculate loan payment using PMT formula
 */
export function calculateLoanPayment(
  principal: number,
  annualInterestRate: number,
  timeInYears: number,
  paymentFrequency: number = 12 // Monthly payments
): LoanCalculation {
  const monthlyRate = annualInterestRate / (100 * paymentFrequency);
  const totalPayments = timeInYears * paymentFrequency;
  
  let monthlyPayment: number;
  
  if (monthlyRate === 0) {
    // No interest case
    monthlyPayment = principal / totalPayments;
  } else {
    // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                     (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }
  
  const totalAmount = monthlyPayment * totalPayments;
  const interestAmount = totalAmount - principal;
  
  return {
    principal,
    interestRate: annualInterestRate,
    interestAmount,
    totalAmount,
    monthlyPayment,
    totalPayments,
  };
}

/**
 * Calculate time in years between two dates
 */
export function calculateTimeInYears(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  return daysDiff / 365.25; // Account for leap years
}

/**
 * Get loan calculation based on loan type and parameters
 */
export function getLoanCalculation(
  principal: number,
  interestRate: number,
  startDate: Date,
  dueDate: Date,
  calculationType: 'simple' | 'compound' | 'payment' = 'simple'
): LoanCalculation {
  const timeInYears = calculateTimeInYears(startDate, dueDate);
  
  switch (calculationType) {
    case 'compound':
      return calculateCompoundInterest(principal, interestRate, timeInYears);
    case 'payment':
      return calculateLoanPayment(principal, interestRate, timeInYears);
    case 'simple':
    default:
      return calculateSimpleInterest(principal, interestRate, timeInYears);
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
