
"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, subDays } from "date-fns";
import { formatCurrency } from "@/lib/currency-utils";
import { TrendingUp } from "lucide-react";

type ProcessedDataPoint = {
  date: string; // Formatted date string for XAxis
  cashIn: number;
  expenses: number;
};

const aggregateDataByInterval = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  intervalType: "day" | "week" | "month"
): ProcessedDataPoint[] => {
  let intervalPoints: Date[] = [];
  if (intervalType === "day") {
    intervalPoints = eachDayOfInterval({ start: startDate, end: endDate });
  } else if (intervalType === "week") {
    intervalPoints = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
  } else { // month
    intervalPoints = eachMonthOfInterval({ start: startDate, end: endDate });
  }

  return intervalPoints.map(intervalStart => {
    let intervalEnd: Date;
    if (intervalType === "day") {
      intervalEnd = endOfDay(intervalStart);
    } else if (intervalType === "week") {
      intervalEnd = endOfDay(addDays(intervalStart, 6));
    } else { // month
      intervalEnd = endOfDay(new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0));
    }

    const cashIn = transactions
      .filter(t => t.type === "cash-in" && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEnd }))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense" && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEnd }))
      .reduce((sum, t) => sum + t.amount, 0);

    let dateFormat = "MMM d";
    if (intervalType === "week") dateFormat = "'Week of' MMM d";
    if (intervalType === "month") dateFormat = "MMM yyyy";
    
    return {
      date: format(intervalStart, dateFormat),
      cashIn,
      expenses,
    };
  });
};


export function TrendsGraph() {
  const { transactions, filter, currency, loading } = useData();

  const chartData = useMemo(() => {
    if (loading || !transactions.length) return [];

    let { startDate, endDate, type, period } = filter;

    // Determine the interval type for aggregation based on filter
    let intervalType: "day" | "week" | "month" = "day";
    
    // Default to last 30 days if "allTime" or no specific range
    if ((type === "period" && period === "allTime") || (!startDate || !endDate)) {
        endDate = endOfDay(new Date());
        startDate = startOfDay(subDays(endDate, 29)); // Default to last 30 days
        intervalType = "day";
    } else if (type === "period") {
        // For predefined periods, we might want different aggregation
        if (period === "thisMonth" || period === "thisWeek") intervalType = "day";
        // For longer periods like "thisYear" (if added), "month" might be better
    } else if (type === "range" || type === "date") {
      // For custom ranges or specific dates, decide interval based on duration
      if (startDate && endDate) {
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) intervalType = "month"; // More than 3 months, aggregate by month
        else if (diffDays > 30) intervalType = "week"; // More than 1 month, aggregate by week
        else intervalType = "day"; // Otherwise, by day
      }
    }
    
    if (!startDate || !endDate) return []; // Should be handled by default above

    return aggregateDataByInterval(transactions, startDate, endDate, intervalType);

  }, [transactions, filter, loading]);

  if (loading) {
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary"/>
                <CardTitle className="text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription>Loading financial trends data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="h-full w-full bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary"/>
                <CardTitle className="text-2xl">Financial Trends</CardTitle>
            </div>
          <CardDescription>Visual overview of your cash inflow and expenses over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Not enough data to display trends for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary"/>
            <CardTitle className="text-2xl">Financial Trends</CardTitle>
        </div>
        <CardDescription>
          Visual overview of your cash inflow and expenses for the selected period.
          Use the filters above to change the date range and granularity.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value, currency, {notation: 'compact'})}`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name === 'cashIn' ? 'Cash In' : 'Expenses']}
            />
            <Legend wrapperStyle={{paddingTop: '10px'}} />
            <Bar dataKey="cashIn" fill="hsl(var(--chart-2))" name="Cash In" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
