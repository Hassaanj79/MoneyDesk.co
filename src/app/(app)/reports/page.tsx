

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
import { useNotifications } from "@/hooks/use-notifications";
import { useCurrency } from "@/hooks/use-currency";
import { useCategories } from "@/contexts/category-context";
import { useAccounts } from "@/contexts/account-context";
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
};

export default function ReportsPage() {
  const { date } = useDateRange();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { addNotification } = useNotifications();
  const { formatCurrency, currency } = useCurrency();

  // State for report order
  const [reportOrder, setReportOrder] = useState([
    'summary-cards',
    'spending-by-category',
    'expenses-by-account',
    'income-vs-expense',
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
    incomeVsExpenseData,
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
      
    const netSavings = totalIncome - totalExpense;

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

    // Calculate income vs expense data for pie chart
    const incomeVsExpenseData = [
        {
            name: 'Income',
            value: totalIncome,
            color: '#10b981' // green-500
        },
        {
            name: 'Expenses',
            value: totalExpense,
            color: '#ef4444' // red-500
        }
    ];

    return { currentPeriodTransactions, totalIncome, totalExpense, netSavings, spendingData, expensesByAccountName, incomeVsExpenseData };
  }, [transactions, from, to, accounts, categories]);

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
    addNotification({
      icon: FileText,
      title: "Report Generated",
      description: `Successfully downloaded ${reportName}`,
    })
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

    addNotification({
      icon: FileText,
      title: "Report Generated",
      description: `Successfully downloaded ${reportName}`,
    })
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
                          <CardContent className="pt-6">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">
                                    Total Income
                                  </CardTitle>
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-xl sm:text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">
                                    Total Expenses
                                  </CardTitle>
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-xl sm:text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-xl sm:text-2xl font-bold">{formatCurrency(netSavings)}</div>
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
                                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
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
                                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
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
                  if (reportId === 'income-vs-expense') {
                    return (
                      <SortableCard key={reportId} id={reportId}>
                        <Card>
                          <CardHeader>
                            <CardTitle>Income vs Expenses</CardTitle>
                            <CardDescription>
                              A visual comparison of your total income versus total expenses for the selected period.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px] sm:h-[350px]">
                              <ChartContainer config={chartConfig} className="w-full h-full">
                                <PieChart>
                                  <Pie
                                    data={incomeVsExpenseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {incomeVsExpenseData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                  />
                                </PieChart>
                              </ChartContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-muted-foreground">Income: {formatCurrency(totalIncome)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-muted-foreground">Expenses: {formatCurrency(totalExpense)}</span>
                              </div>
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
