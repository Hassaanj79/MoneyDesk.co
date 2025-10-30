"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker>

interface EnhancedCalendarProps extends Omit<CalendarProps, 'month' | 'onMonthChange'> {
  showYearSelector?: boolean;
  yearRange?: { min: number; max: number };
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelect?: (date: Date | DateRange | undefined) => void;
}

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  showYearSelector = true,
  yearRange = { min: 1900, max: new Date().getFullYear() + 10 },
  ...props
}: EnhancedCalendarProps) {
  const [currentYear, setCurrentYear] = React.useState<number>(
    props.defaultMonth?.getFullYear() || new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = React.useState<number>(
    props.defaultMonth?.getMonth() || new Date().getMonth()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(
    props.defaultMonth || new Date()
  );

  // Generate year options
  const years = React.useMemo(() => {
    const yearList = [];
    for (let year = yearRange.max; year >= yearRange.min; year--) {
      yearList.push(year);
    }
    return yearList;
  }, [yearRange.min, yearRange.max]);

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearChange = React.useCallback((year: string) => {
    const newYear = parseInt(year, 10);
    setCurrentYear(newYear);
    // Use the current month value directly
    const newDate = new Date(newYear, currentMonth, 1);
    setSelectedMonth(newDate);
    if (props.onMonthChange) {
      props.onMonthChange(newDate);
    }
  }, [props, currentMonth]);

  const handleMonthDropdownChange = React.useCallback((month: string) => {
    const newMonth = parseInt(month, 10);
    setCurrentMonth(newMonth);
    // Use the current year value directly
    const newDate = new Date(currentYear, newMonth, 1);
    setSelectedMonth(newDate);
    if (props.onMonthChange) {
      props.onMonthChange(newDate);
    }
  }, [props, currentYear]);

  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    React.useEffect(() => {
      const year = displayMonth.getFullYear();
      const month = displayMonth.getMonth();
      setCurrentYear(year);
      setCurrentMonth(month);
    }, [displayMonth]);

    const handlePrevMonth = () => {
      const newMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
      setSelectedMonth(newMonth);
      if (props.onMonthChange) {
        props.onMonthChange(newMonth);
      }
    };

    const handleNextMonth = () => {
      const newMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
      setSelectedMonth(newMonth);
      if (props.onMonthChange) {
        props.onMonthChange(newMonth);
      }
    };

    return (
      <div className="flex items-center justify-center gap-2 py-2 relative z-[120]">
        {showYearSelector ? (
          <>
            {/* Left Arrow */}
            <button
              className="h-8 w-8 bg-white p-0 opacity-100 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gray-800 hover:text-gray-900 font-bold" />
            </button>

            <Select value={currentMonth.toString()} onValueChange={handleMonthDropdownChange}>
              <SelectTrigger className="w-32 h-8 text-sm relative z-[120]">
                <SelectValue>
                  {months[currentMonth] || months[0]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={currentYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-20 h-8 text-sm relative z-[120]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Right Arrow */}
            <button
              className="h-8 w-8 bg-white p-0 opacity-100 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-gray-800 hover:text-gray-900 font-bold" />
            </button>
          </>
        ) : (
          <>
            {/* Left Arrow */}
            <button
              className="h-8 w-8 bg-white p-0 opacity-100 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gray-800 hover:text-gray-900 font-bold" />
            </button>

            <div className="text-sm font-medium px-2">
              {format(displayMonth, "MMMM yyyy")}
            </div>

            {/* Right Arrow */}
            <button
              className="h-8 w-8 bg-white p-0 opacity-100 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-gray-800 hover:text-gray-900 font-bold" />
            </button>
          </>
        )}
      </div>
    );
  };

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
    if (props.onMonthChange) {
      props.onMonthChange(newMonth);
    }
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={selectedMonth}
      onMonthChange={handleMonthChange}
      enableYearNavigation={true}
      enableMonthNavigation={true}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center z-[120] px-16",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white p-0 opacity-100 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        ),
        nav_button_previous: "absolute left-2 z-30",
        nav_button_next: "absolute right-2 z-30",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
      }}
      {...(props as any)}
    />
  )
}

EnhancedCalendar.displayName = "EnhancedCalendar"

export { EnhancedCalendar }
