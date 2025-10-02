
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

interface DateRangeContextType {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const DateRangeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with default date range to prevent undefined errors
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const fromDate = subDays(today, 6);
    return {
      from: fromDate,
      to: today,
    };
  });

  useEffect(() => {
    // This effect is now optional since we initialize with default values
    // But we can keep it for any future logic that might need to run
    const today = new Date();
    const fromDate = subDays(today, 6);
    const toDate = today;
    
    setDate({
      from: fromDate,
      to: toDate,
    });
  }, []);

  return (
    <DateRangeContext.Provider value={{ date, setDate }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};
