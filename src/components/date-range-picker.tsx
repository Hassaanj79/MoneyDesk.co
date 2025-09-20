
"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, subDays } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "./ui/separator"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ className, date, onDateChange }: DateRangePickerProps) {
  const [preset, setPreset] = React.useState<string>("custom");
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    switch (value) {
      case 'this-week':
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case 'last-week':
        from = startOfWeek(subWeeks(now, 1));
        to = endOfWeek(subWeeks(now, 1));
        break;
      case 'this-month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last-month':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'this-year':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'last-year':
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      case 'last-7-days':
        from = subDays(now, 6);
        to = now;
        break;
       case 'last-30-days':
        from = subDays(now, 29);
        to = now;
        break;
      case 'custom':
        onDateChange(undefined);
        return;
    }
    onDateChange({ from, to });
  };
  
  const handleDateSelect = (range: DateRange | undefined) => {
    setPreset("custom");
    onDateChange(range);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
            <div className="flex items-center p-2">
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Separator />
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
          <Separator />
          <div className="flex justify-end p-2">
            <PopoverClose asChild>
                <Button>Confirm</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
