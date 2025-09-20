
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
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const today = new Date();
    // Default to last 7 days
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
