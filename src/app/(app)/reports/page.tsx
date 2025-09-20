

"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, ArrowUp, ArrowDown, Wallet, ChevronDown, FileText } from "lucide-react";
import { useDateRange } from "@/contexts/date-range-context";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useTransactions } from "@/contexts/transaction-context";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { useNotifications } from "@/contexts/notification-context";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";
import { useAccounts } from "@/contexts/account-context";
import { useBudgets } from "@/contexts/budget-context";
import { useLoans } from "@/contexts/loan-context";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Card Component
interface SortableCardProps {
  id: string;
  children: React.ReactNode;
}

function SortableCard({ id, children }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

const generatedReports = [
  { id: "1", name: "Q3 2024 Expense Report", date: "2024-10-05", type: "PDF" },
  { id: "2", name: "September 2024 Spending", date: "2024-10-2", type: "CSV" },
  { id: "3", name: "Q3 2024 Income Statement", date: "2024-10-01", type: "PDF" },
  { id: "4", name: "August 2024 Transactions", date: "2024-09-05", type: "CSV" },
  { id: "5", name: "Q2 2024 Summary", date: "2024-07-03", type: "PDF" },
];

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
  income: {
    label: "Income",
    color: "hsl(142, 76%, 36%)", // green-600
  },
  expense: {
    label: "Expenses",
    color: "hsl(0, 84%, 60%)", // red-500
  },
  savings: {
    label: "Savings",
    color: "hsl(217, 91%, 60%)", // blue-500
  },
  count: {
    label: "Count",
    color: "hsl(262, 83%, 58%)", // purple-500
  },
  budget: {
    label: "Budget",
    color: "hsl(142, 76%, 36%)", // green-600
  },
  spent: {
    label: "Spent",
    color: "hsl(0, 84%, 60%)", // red-500
  },
};

export default function ReportsPage() {
  const { date } = useDateRange();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();
  const { loans } = useLoans();
  // const { addNotification } = useNotifications();
  const { formatCurrency, currency } = useCurrency();

  // State for report order
  const [reportOrder, setReportOrder] = useState([
    'summary-cards',
    'monthly-trends',
    'spending-by-category',
    'expenses-by-account',
    'saving-trends',
    'account-balance-distribution',
    'budget-performance',
    'loan-status-overview',
    'transaction-frequency',
    'generated-reports'
  ]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReportOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const { from, to } = date || {};
  const fromDate = from ? format(from, "LLL dd, y") : null;
  const toDate = to ? format(to, "LLL dd, y") : null;

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };


  const {
    currentPeriodTransactions,
    totalIncome,
    totalExpense,
    netSavings,
    spendingData,
    expensesByAccountName,
    monthlyTrendsData,
    savingsTrendsData,
    accountBalanceDistribution,
    budgetPerformanceData,
    loanStatusData,
    transactionFrequencyData
  } = useMemo(() => {
    const currentPeriodTransactions = transactions.filter((t) =>
      from && to ? isWithinInterval(parseISO(t.date), { start: from, end: to }) : true
    );

    const totalIncome = currentPeriodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentPeriodTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Calculate net savings as total of all account balances
    const netSavings = accounts.reduce((total, account) => {
      const accountBalance = transactions.reduce((acc, t) => {
        if (t.accountId === account.id) {
          return acc + (t.type === 'income' ? t.amount : -t.amount);
        }
        return acc;
      }, account.initialBalance || 0);
      return total + accountBalance;
    }, 0);

    const spendingByCategory = currentPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const categoryName = getCategoryName(t.categoryId);
            if (!acc[categoryName]) {
                acc[categoryName] = 0;
            }
            acc[categoryName] += t.amount;
            return acc;
        }, {} as Record<string, number>);

    const spendingData = Object.entries(spendingByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a,b) => b.amount - a.amount);

    // Calculate expenses by account name
    const expensesByAccountNameData = currentPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const account = accounts.find(a => a.id === t.accountId);
            if (account) {
                const accountName = account.name;
                if (!acc[accountName]) {
                    acc[accountName] = 0;
                }
                acc[accountName] += t.amount;
            }
            return acc;
        }, {} as Record<string, number>);

    const expensesByAccountName = Object.entries(expensesByAccountNameData)
        .map(([accountName, amount]) => ({ accountName, amount }))
        .sort((a,b) => b.amount - a.amount);


    // Calculate monthly trends data
    const monthlyData: Record<string, { income: number; expense: number; month: string }> = {};
    
    currentPeriodTransactions.forEach(transaction => {
      const month = format(parseISO(transaction.date), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, month };
      }
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else {
        monthlyData[month].expense += transaction.amount;
      }
    });
    
    const monthlyTrendsData = Object.values(monthlyData).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate savings trends data based on selected date range
    const savingsTrendsData = (() => {
      if (!from || !to) {
        // If no date range selected, show monthly data
        return monthlyTrendsData.map(month => ({
          period: month.month,
          savings: month.income - month.expense,
          income: month.income,
          expense: month.expense
        }));
      } else {
        // If date range selected, show daily data within the range
        const daysInRange = [];
        const currentDate = new Date(from);
        const endDate = new Date(to);
        
        while (currentDate <= endDate) {
          const dayStr = format(currentDate, 'MMM dd');
          const dayTransactions = currentPeriodTransactions.filter(t => 
            format(parseISO(t.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
          );
          
          const dayIncome = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const dayExpense = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          daysInRange.push({
            period: dayStr,
            savings: dayIncome - dayExpense,
            income: dayIncome,
            expense: dayExpense
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return daysInRange;
      }
    })();

    // Calculate account balance distribution
    const colors = [
      '#10b981', // green-500
      '#3b82f6', // blue-500
      '#f59e0b', // yellow-500
      '#ef4444', // red-500
      '#8b5cf6', // purple-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#f97316', // orange-500
      '#ec4899', // pink-500
      '#6b7280', // gray-500
    ];
    
    // Calculate account balances
    const accountBalances = accounts.map((account, index) => {
      const balance = transactions.reduce((acc, t) => {
        if (t.accountId === account.id) {
          return acc + (t.type === 'income' ? t.amount : -t.amount);
        }
        return acc;
      }, account.initialBalance || 0);
      
      return {
        name: account.name,
        balance: Math.abs(balance),
        color: colors[index % colors.length]
      };
    }).filter(account => account.balance > 0);

    // Calculate total balance for percentage calculation
    const totalBalance = accountBalances.reduce((sum, account) => sum + account.balance, 0);
    
    // Create pie chart data with minimum segment size for visibility
    const accountBalanceDistribution = accountBalances.map(account => {
      const percentage = (account.balance / totalBalance) * 100;
      
      return {
        name: account.name,
        value: account.balance,
        percentage: percentage,
        color: account.color,
        // Ensure minimum visibility for very small accounts
        displayValue: percentage < 1 ? Math.max(account.balance, totalBalance * 0.01) : account.balance
      };
    });

    // Calculate budget performance
    const budgetPerformanceData = budgets.map(budget => {
      const categoryTransactions = currentPeriodTransactions.filter(t => 
        t.type === 'expense' && t.categoryId === budget.categoryId
      );
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const progress = (spent / budget.amount) * 100;
      
      return {
        name: budget.name,
        budget: budget.amount,
        spent: spent,
        remaining: budget.amount - spent,
        progress: Math.min(progress, 100),
        status: progress > 100 ? 'Over Budget' : progress > 80 ? 'Near Limit' : 'On Track'
      };
    });

    // Calculate loan status overview
    const statusCounts = loans.reduce((acc, loan) => {
      const status = loan.status === 'completed' ? 'Completed' : 'Active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const loanStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'Completed' ? '#10b981' : '#f59e0b'
    }));

    // Calculate transaction frequency data
    const frequencyData: Record<string, number> = {};
    
    currentPeriodTransactions.forEach(transaction => {
      const day = format(parseISO(transaction.date), 'EEEE'); // Day of week
      frequencyData[day] = (frequencyData[day] || 0) + 1;
    });
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const transactionFrequencyData = days.map(day => ({
      day,
      count: frequencyData[day] || 0
    }));


    return { 
      currentPeriodTransactions, 
      totalIncome, 
      totalExpense, 
      netSavings, 
      spendingData, 
      expensesByAccountName, 
      monthlyTrendsData,
      savingsTrendsData,
      accountBalanceDistribution,
      budgetPerformanceData,
      loanStatusData,
      transactionFrequencyData
    };
  }, [transactions, from, to, accounts, categories, budgets, loans]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const incomeTransactions = currentPeriodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = currentPeriodTransactions.filter(t => t.type === 'expense');
    const reportName = `income-statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    doc.setFontSize(20);
    doc.text("Income Statement", 14, 22);
    doc.setFontSize(12);
    if (fromDate && toDate) {
      doc.text(`Date Range: ${fromDate} - ${toDate}`, 14, 30);
    }
    
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);
    autoTable(doc, {
        startY: 50,
        body: [
            ['Total Income', formatCurrency(totalIncome)],
            ['Total Expenses', formatCurrency(totalExpense)],
            ['Net Savings', formatCurrency(netSavings)],
        ],
        theme: 'striped',
        styles: { fontSize: 12 },
    });

    const tableStartY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.text("Income", 14, tableStartY);
    autoTable(doc, {
        startY: tableStartY + 5,
        head: [['Date', 'Description', 'Category', 'Amount']],
        body: incomeTransactions.map(t => [format(parseISO(t.date), 'yyyy-MM-dd'), t.name, getCategoryName(t.categoryId), formatCurrency(t.amount)]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });

    const secondTableY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Expenses", 14, secondTableY);
     autoTable(doc, {
        startY: secondTableY + 5,
        head: [['Date', 'Description', 'Category', 'Amount']],
        body: expenseTransactions.map(t => [format(parseISO(t.date), 'yyyy-MM-dd'), t.name, getCategoryName(t.categoryId), formatCurrency(t.amount)]),
        theme: 'striped',
        headStyles: { fillColor: [192, 57, 43] },
    });


    doc.save(reportName);
    // addNotification({
    //   type: 'report_generated',
    //   title: "Report Generated",
    //   message: `Successfully downloaded ${reportName}`,
    //   navigationPath: '/reports'
    // });
  };

  const generateCSV = () => {
    const incomeTransactions = currentPeriodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = currentPeriodTransactions.filter(t => t.type === 'expense');
    const reportName = `income-statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    const headers = ['Date', 'Description', 'Category', `Amount (${currency})`];
    
    const formatTransactionsToCSV = (transactions: typeof currentPeriodTransactions) => 
      transactions.map(t => 
        [
          format(parseISO(t.date), 'yyyy-MM-dd'),
          `"${t.name.replace(/"/g, '""')}"`,
          getCategoryName(t.categoryId),
          t.amount.toFixed(2)
        ].join(',')
      ).join('\n');

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Income Statement\n`;
    if(fromDate && toDate) {
      csvContent += `Date Range: ${fromDate} - ${toDate}\n`;
    }
    csvContent += "\nSummary\n";
    csvContent += `Total Income,${totalIncome.toFixed(2)}\n`;
    csvContent += `Total Expenses,${totalExpense.toFixed(2)}\n`;
    csvContent += `Net Savings,${netSavings.toFixed(2)}\n`;
    
    csvContent += "\nIncome\n";
    csvContent += headers.join(',') + '\n';
    csvContent += formatTransactionsToCSV(incomeTransactions) + '\n';

    csvContent += "\nExpenses\n";
    csvContent += headers.join(',') + '\n';
    csvContent += formatTransactionsToCSV(expenseTransactions) + '\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", reportName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // addNotification({
    //   type: 'report_generated',
    //   title: "Report Generated",
    //   message: `Successfully downloaded ${reportName}`,
    //   navigationPath: '/reports'
    // });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reports</CardTitle>
            {fromDate && toDate && (
              <CardDescription className="text-sm">
                Showing data for the period: {fromDate} - {toDate}
              </CardDescription>
            )}
          </div>
          <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto gap-1">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate Report</span>
                    <span className="sm:hidden">Generate</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={generatePDF}>Download as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={generateCSV}>Download as CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={reportOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {reportOrder.map((reportId) => {
                  if (reportId === 'summary-cards') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
            <Card>
                          <CardContent className="p-6">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
                <ArrowUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                                  <div className="text-xl sm:text-2xl font-bold text-green-500 break-words overflow-visible">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <ArrowDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                                  <div className="text-xl sm:text-2xl font-bold text-red-500 break-words overflow-visible">{formatCurrency(totalExpense)}</div>
              </CardContent>
            </Card>
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                                  <div className="text-xl sm:text-2xl font-bold break-words overflow-visible">{formatCurrency(netSavings)}</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'spending-by-category') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>
                              A breakdown of your expenses by category for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <BarChart
                accessibilityLayer
                data={spendingData}
                margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact' })}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'expenses-by-account') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Expenses by Account Name</CardTitle>
                            <CardDescription>
                              A breakdown of your expenses by the specific account used for transactions.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <BarChart
                                  accessibilityLayer
                                  data={expensesByAccountName}
                                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="accountName"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                  />
                                  <YAxis
                                    tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact' })}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                  />
                                  <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                                </BarChart>
                              </ChartContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'monthly-trends') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Monthly Income vs Expense Trends</CardTitle>
                            <CardDescription>
                              Track your monthly income and expense patterns over time.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <ComposedChart
                                  accessibilityLayer
                                  data={monthlyTrendsData}
                                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                  />
                                  <YAxis
                                    tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact' })}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                  />
                                  <Legend />
                                  <Bar dataKey="income" fill="var(--color-income)" name="Income" />
                                  <Bar dataKey="expense" fill="var(--color-expense)" name="Expenses" />
                                </ComposedChart>
                              </ChartContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'saving-trends') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Saving Trends</CardTitle>
                            <CardDescription>
                              Track your savings performance over the selected time period.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <AreaChart
                                  accessibilityLayer
                                  data={savingsTrendsData}
                                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="period"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                  />
                                  <YAxis
                                    tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact' })}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="var(--color-savings)"
                                    fill="var(--color-savings)"
                                    fillOpacity={0.3}
                                  />
                                </AreaChart>
                              </ChartContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'account-balance-distribution') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Account Balance Distribution</CardTitle>
                            <CardDescription>
                              Visualize the distribution of funds across your accounts.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <PieChart>
                                  <Pie
                                    data={accountBalanceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="displayValue"
                                  >
                                    {accountBalanceDistribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                                            <p className="font-medium">{data.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
                                            </p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ChartContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                              {accountBalanceDistribution.map((account, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: account.color }}
                                  ></div>
                                  <span className="text-sm text-muted-foreground">
                                    {account.name}: {formatCurrency(account.value)} ({account.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'transaction-frequency') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Transaction Frequency by Day</CardTitle>
                            <CardDescription>
                              See which days of the week you're most active with transactions.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <BarChart
                                  accessibilityLayer
                                  data={transactionFrequencyData}
                                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                  />
                                  <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent formatter={(value) => `${value} transactions`}/>}
                                  />
                                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                              </ChartContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'budget-performance') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Budget Performance</CardTitle>
                            <CardDescription>
                              Track how well you're sticking to your budgets across different categories.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <BarChart
                                  accessibilityLayer
                                  data={budgetPerformanceData}
                                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                  />
                                  <YAxis
                                    tickFormatter={(value) => formatCurrency(value as number, { notation: 'compact' })}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                  />
                                  <Legend />
                                  <Bar dataKey="budget" fill="var(--color-budget)" name="Budget" />
                                  <Bar dataKey="spent" fill="var(--color-spent)" name="Spent" />
                                </BarChart>
                              </ChartContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                              {budgetPerformanceData.map((budget, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      budget.status === 'Over Budget' ? 'bg-red-500' : 
                                      budget.status === 'Near Limit' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></div>
                                    <span className="text-sm font-medium">{budget.name}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {budget.progress.toFixed(1)}% used
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'loan-status-overview') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Loan Status Overview</CardTitle>
                            <CardDescription>
                              Visualize the distribution of your loans by status.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <PieChart>
                                  <Pie
                                    data={loanStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {loanStatusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={<ChartTooltipContent formatter={(value) => `${value} loans`}/>}
                                  />
                                </PieChart>
                              </ChartContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                              {loanStatusData.map((status, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: status.color }}
                                  ></div>
                                  <span className="text-sm text-muted-foreground">
                                    {status.name}: {status.value} loans
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  if (reportId === 'generated-reports') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            Download your previously generated financial reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Date Generated</TableHead>
                                  <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generatedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.date}</TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {report.type}
                                      </span>
                                    </TableCell>
                  <TableCell className="text-right">
                                      <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  }
                  return null;
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
