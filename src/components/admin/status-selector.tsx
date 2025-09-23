"use client";

import { useState } from 'react';
import { Check, ChevronDown, Clock, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CancellationRequest } from '@/types';

interface StatusSelectorProps {
  value: CancellationRequest['status'];
  onChange: (status: CancellationRequest['status']) => void;
  disabled?: boolean;
  className?: string;
}

const statusOptions = [
  {
    value: 'NEW' as const,
    label: 'New',
    icon: Clock,
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    activeColor: 'bg-red-200 text-red-900'
  },
  {
    value: 'IN_PROGRESS' as const,
    label: 'In Progress',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    activeColor: 'bg-blue-200 text-blue-900'
  },
  {
    value: 'RETAINED' as const,
    label: 'Retained',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    activeColor: 'bg-green-200 text-green-900'
  },
  {
    value: 'CANCELLED' as const,
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
    activeColor: 'bg-gray-200 text-gray-900'
  }
];

export function StatusSelector({ value, onChange, disabled, className }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = statusOptions.find(option => option.value === value);
  const SelectedIcon = selectedOption?.icon || Clock;
  
  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between px-3 py-2 h-auto min-h-[40px]",
          selectedOption?.color,
          isOpen && selectedOption?.activeColor,
          "border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className="h-4 w-4" />
          <span className="font-medium font-sans">{selectedOption?.label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-3 flex items-center gap-3 text-left transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700",
                    isSelected && "bg-gray-100 dark:bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors duration-200",
                    option.color,
                    isSelected && option.activeColor
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium flex-1 font-sans">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
