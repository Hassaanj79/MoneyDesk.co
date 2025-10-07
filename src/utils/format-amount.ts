/**
 * Professional number formatter for large amounts
 * Formats numbers with appropriate abbreviations (K, M, B, T)
 */
export const formatAmount = (value: number, currency: string = 'PKR'): string => {
  if (value === 0) return `${currency} 0.00`;
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${sign}${currency} ${(absValue / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}${currency} ${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${currency} ${(absValue / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${currency} ${(absValue / 1e3).toFixed(2)}K`;
  } else {
    return `${sign}${currency} ${absValue.toFixed(2)}`;
  }
};

/**
 * Format amount with color classes for positive/negative values
 */
export const formatAmountWithColor = (value: number, currency: string = 'PKR') => {
  const formatted = formatAmount(value, currency);
  const colorClass = value > 0 
    ? 'text-green-600 dark:text-green-400' 
    : value < 0 
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-600 dark:text-gray-400';
  
  return { formatted, colorClass };
};
