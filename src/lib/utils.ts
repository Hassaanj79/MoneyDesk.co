import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  subDays, 
  subWeeks, 
  subMonths, 
  subYears, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears
} from "date-fns"
import { DateRange } from "react-day-picker"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the previous period based on the current selected date range
 * @param currentRange - The currently selected date range
 * @returns The previous period date range for comparison
 */
export function getPreviousPeriod(currentRange: DateRange | undefined): DateRange | undefined {
  if (!currentRange?.from || !currentRange?.to) {
    return undefined;
  }

  const from = currentRange.from;
  const to = currentRange.to;
  const duration = differenceInDays(to, from);

  // For any duration, calculate the same duration backwards
  const prevStart = subDays(from, duration + 1);
  const prevEnd = subDays(to, duration + 1);
  return { from: prevStart, to: prevEnd };
}

/**
 * Get a human-readable description of the comparison period
 * @param currentRange - The currently selected date range
 * @returns A description of what period is being compared
 */
export function getComparisonDescription(currentRange: DateRange | undefined): string {
  if (!currentRange?.from || !currentRange?.to) {
    return "from last period";
  }

  const from = currentRange.from;
  const to = currentRange.to;
  const duration = differenceInDays(to, from);

  if (duration === 0) {
    return "from yesterday";
  }
  if (duration === 1) {
    return "from 2 days ago";
  }
  if (duration === 2) {
    return "from 3 days ago";
  }
  if (duration === 6) {
    return "from last week";
  }
  if (duration === 13) {
    return "from 2 weeks ago";
  }
  if (duration >= 28 && duration <= 31) {
    return "from last month";
  }
  if (duration >= 56 && duration <= 62) {
    return "from 2 months ago";
  }
  if (duration >= 365 && duration <= 366) {
    return "from last year";
  }
  if (duration >= 730 && duration <= 732) {
    return "from 2 years ago";
  }
  
  return `from previous ${duration + 1} days`;
}
