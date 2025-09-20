
"use client";

import { useEffect, useState } from 'react';
import { useTransactions } from '@/contexts/transaction-context';
// import { useNotifications } from '@/contexts/notification-context';
import { Transaction } from '@/types';
import { parseISO, addDays, addWeeks, addMonths, addYears, isTomorrow, format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useCurrency } from './use-currency';

const NOTIFICATION_STORAGE_KEY = 'recurring_notifications_sent';

const getNextRecurrenceDate = (transaction: Transaction): Date | null => {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return null;
    }

    const startDate = parseISO(transaction.date);
    const now = new Date();
    let nextDate = startDate;

    const incrementDate = (date: Date): Date => {
        switch (transaction.recurrenceFrequency) {
            case 'daily':
                return addDays(date, 1);
            case 'weekly':
                return addWeeks(date, 1);
            case 'monthly':
                return addMonths(date, 1);
            case 'yearly':
                return addYears(date, 1);
            default:
                return addDays(date, 1); // Should not happen
        }
    };
    
    // Find the next recurrence date that is in the future
    while (nextDate < now) {
        nextDate = incrementDate(nextDate);
    }
    
    // If we've skipped way past today, let's find the one closest to today.
    // This handles the case where the start date is very far in the past.
    let previousDate = nextDate;
    while(true) {
        let tempPrevious = previousDate;
        previousDate = incrementDate(previousDate);
        if(previousDate > now) {
            previousDate = tempPrevious;
            break;
        }
    }
    
    // After the loop, `previousDate` is the last occurrence before or on `now`.
    // The next occurrence is one increment after that.
    nextDate = incrementDate(previousDate);


    return nextDate;
};


export const useRecurringNotifications = () => {
    const { transactions } = useTransactions();
    // const { addNotification } = useNotifications();
    const { formatCurrency } = useCurrency();
    const [sentNotifications, setSentNotifications] = useState<Record<string, string>>({});

    useEffect(() => {
        try {
            const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
            if (stored) {
                setSentNotifications(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Could not read from localStorage", error);
        }
    }, []);

    useEffect(() => {
        const recurringExpenses = transactions.filter(
            (t) => t.type === 'expense' && t.isRecurring && t.recurrenceFrequency
        );

        const newSentNotifications: Record<string, string> = { ...sentNotifications };
        let updated = false;

        for (const transaction of recurringExpenses) {
            const nextDueDate = getNextRecurrenceDate(transaction);

            if (nextDueDate && isTomorrow(nextDueDate)) {
                const notificationId = `${transaction.id}-${format(nextDueDate, 'yyyy-MM-dd')}`;
                
                if (!sentNotifications[notificationId]) {
                    // addNotification({
                    //     type: 'recurring_reminder',
                    //     title: 'Upcoming Recurring Expense',
                    //     message: `Your payment for "${transaction.description}" of ${formatCurrency(transaction.amount)} is due tomorrow.`,
                    //     navigationPath: '/transactions',
                    //     relatedEntityId: transaction.id,
                    //     relatedEntityType: 'transaction'
                    // });
                    newSentNotifications[notificationId] = 'sent';
                    updated = true;
                }
            }
        }

        if (updated) {
            setSentNotifications(newSentNotifications);
            try {
                localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSentNotifications));
            } catch (error) {
                console.error("Could not write to localStorage", error);
            }
        }
    }, [transactions, formatCurrency, sentNotifications]);

    return null; 
};
