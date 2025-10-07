
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

  // Removed the useEffect that was overriding the date range
  // This was preventing predefined date filters from working

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
