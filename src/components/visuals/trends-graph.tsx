
"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, subDays, differenceInDays, addDays } from "date-fns";
import { formatCurrency } from "@/lib/currency-utils";
import { TrendingUp, AlertCircle } from "lucide-react";

type ProcessedDataPoint = {
  date: string; // Formatted date string for XAxis
  cashIn: number;
  expenses: number;
};

const ensureDateObjects = (transactions: Transaction[]): Transaction[] => {
  return transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date) 
  }));
};

const aggregateDataByInterval = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  intervalType: "day" | "week" | "month"
): ProcessedDataPoint[] => {
  let intervalPoints: Date[] = [];
  if (!startDate || !endDate || startDate > endDate) return []; // Guard against invalid date ranges

  try {
    if (intervalType === "day") {
      intervalPoints = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (intervalType === "week") {
      intervalPoints = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    } else { // month
      intervalPoints = eachMonthOfInterval({ start: startDate, end: endDate });
    }
  } catch (error) {
    console.error("Error generating interval points for graph:", error, {startDate, endDate, intervalType});
    return []; // Return empty if interval generation fails
  }


  const ensuredTransactions = ensureDateObjects(transactions);

  return intervalPoints.map(intervalStart => {
    let intervalEndRange: Date;
    if (intervalType === "day") {
      intervalEndRange = endOfDay(intervalStart);
    } else if (intervalType === "week") {
      intervalEndRange = endOfDay(addDays(intervalStart, 6));
    } else { // month
      intervalEndRange = endOfDay(new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0));
    }

    const cashIn = ensuredTransactions
      .filter(t => t.type === "cash-in" && isWithinInterval(t.date, { start: intervalStart, end: intervalEndRange }))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = ensuredTransactions
      .filter(t => t.type === "expense" && isWithinInterval(t.date, { start: intervalStart, end: intervalEndRange }))
      .reduce((sum, t) => sum + t.amount, 0);

    let dateFormat = "MMM d";
    if (intervalType === "week") dateFormat = "'W'w"; // Shortened week format
    if (intervalType === "month") dateFormat = "MMM yy";
    
    // For single day or very short ranges, show full date for days
    const diffDaysTotal = differenceInDays(endDate, startDate) +1;
    if (intervalType === "day" && diffDaysTotal > 7) dateFormat = "d"; // if many days, just show day number
    else if (intervalType === "day") dateFormat = "MMM d";


    return {
      date: format(intervalStart, dateFormat),
      cashIn,
      expenses,
    };
  });
};


export function TrendsGraph() {
  // `transactions` from useData are already scoped to current user and current project
  const { transactions: projectScopedTransactions, filter, currency, loading: dataContextLoading, currentProjectId } = useData();

  const chartData = useMemo(() => {
    if (dataContextLoading || !projectScopedTransactions || !currentProjectId) return []; // Guard: if context loading, or no transactions for current project, or no project selected

    let { startDate, endDate, type, period } = filter;
    let intervalType: "day" | "week" | "month" = "day";
    
    // Determine default start/end dates if "allTime" or not specified
    if ((type === "period" && period === "allTime") || !startDate || !endDate) {
        if (projectScopedTransactions.length > 0) {
            const ensured = ensureDateObjects(projectScopedTransactions);
            const dates = ensured.map(t => t.date.getTime());
            startDate = startOfDay(new Date(Math.min(...dates)));
            endDate = endOfDay(new Date(Math.max(...dates)));
            if (startDate.getTime() === endDate.getTime()) { 
                 endDate = endOfDay(addDays(startDate,1)); 
            }
        } else {
            endDate = endOfDay(new Date());
            startDate = startOfDay(subDays(endDate, 29)); 
        }
    }
    
    if (!startDate || !endDate) return []; // Should be set by logic above

    const diffDays = differenceInDays(endDate, startDate) + 1;
    if (type === "date" || (type === "period" && period === "today")) { 
        intervalType = "day";
    } else if (diffDays <= 2 && type === "range") { 
        intervalType = "day";
    } else if (diffDays > 90) { // More than ~3 months
        intervalType = "month";
    } else if (diffDays > 30) { // More than 1 month
        intervalType = "week";
    } else { 
        intervalType = "day";
    }
    
    return aggregateDataByInterval(projectScopedTransactions, startDate, endDate, intervalType);

  }, [projectScopedTransactions, filter, dataContextLoading, currentProjectId]);

  if (dataContextLoading && !currentProjectId) { 
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
                <CardTitle className="text-xl sm:text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription className="text-sm sm:text-base">Loading financial trends data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <div className="h-full w-full bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!currentProjectId && !dataContextLoading) { 
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground"/>
                <CardTitle className="text-xl sm:text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription className="text-sm sm:text-base">Visual overview of cash inflow and expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm sm:text-base">Please select a project to view its financial trends.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (dataContextLoading && currentProjectId) { 
     return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
                <CardTitle className="text-xl sm:text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription className="text-sm sm:text-base">Loading trends for current project...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <div className="h-full w-full bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }


  if (!chartData.length && currentProjectId) { 
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
                <CardTitle className="text-xl sm:text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription className="text-sm sm:text-base">Visual overview of your cash inflow and expenses over time for the current project.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm sm:text-base">Not enough data to display trends for the selected project and period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
            <CardTitle className="text-xl sm:text-2xl">Financial Trends</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base">
          Line chart showing cash inflow and expenses for the current project. Use filters to adjust the view.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value, currency, {notation: 'compact', maximumFractionDigits: 0})}`} />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                fontSize: '0.75rem', // text-xs for tooltip
                padding: '0.5rem'
              }}
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name === 'cashIn' ? 'Cash In' : 'Expenses']}
            />
            <Legend wrapperStyle={{paddingTop: '10px', fontSize: '0.75rem'}} />
            <Line type="monotone" dataKey="cashIn" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Cash In" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name="Expenses" dot={{ r: 3 }} activeDot={{ r: 5 }}/>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

    
