
"use client";

import type { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useAccounts } from "@/contexts/account-context";
import { useCategories } from "@/contexts/category-context";

type TransactionDetailsProps = {
  transaction: Transaction;
  children?: React.ReactNode;
};

// Helper function to safely format dates
const formatDate = (date: any): string => {
  try {
    if (!date) return 'N/A';
    
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Try to parse as ISO string first
      if (date.includes('T') || date.includes('Z')) {
        dateObj = parseISO(date);
      } else {
        // Try to parse as regular date string
        dateObj = new Date(date);
      }
    } else if (date && typeof date === 'object' && date.toDate) {
      // Handle Firestore Timestamp
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    
    return format(dateObj, "PPP");
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Invalid Date';
  }
};

export function TransactionDetails({ transaction, children }: TransactionDetailsProps) {
  const { name, amount, type, date, categoryId, accountId } = transaction;
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  
  const account = accounts.find(a => a.id === accountId);
  const category = categories.find(c => c.id === categoryId);


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-semibold">{name}</h2>
        <div
          className={cn(
            "text-xl font-bold",
            type === "income" ? "text-green-500" : "text-red-500"
          )}
        >
          {type === "expense" ? "-" : "+"}{formatCurrency(amount)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Date</p>
          <p>{formatDate(date)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Category</p>
          <div>
            <Badge variant="outline">{category?.name || 'N/A'}</Badge>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground">Account</p>
          <p>{account?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Type</p>
          <p className="capitalize">{type}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
