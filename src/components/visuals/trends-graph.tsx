
"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Changed from BarChart
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, subDays, differenceInDays } from "date-fns";
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
    let intervalEndRange: Date;
    if (intervalType === "day") {
      intervalEndRange = endOfDay(intervalStart);
    } else if (intervalType === "week") {
      intervalEndRange = endOfDay(addDays(intervalStart, 6));
    } else { // month
      intervalEndRange = endOfDay(new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0));
    }

    const cashIn = transactions
      .filter(t => t.type === "cash-in" && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEndRange }))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense" && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEndRange }))
      .reduce((sum, t) => sum + t.amount, 0);

    let dateFormat = "MMM d";
    if (intervalType === "week") dateFormat = "'W' w, MMM d"; // e.g. W 23, Jun 5
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

    let intervalType: "day" | "week" | "month" = "day";
    
    if ((type === "period" && period === "allTime") || (!startDate || !endDate)) {
        endDate = endOfDay(new Date());
        startDate = startOfDay(subDays(endDate, 29)); 
        intervalType = "day";
    } else if (startDate && endDate) {
        const diffDays = differenceInDays(endDate, startDate) +1; // Inclusive of start and end day
        if (type === "date" || (type === "period" && period === "today")) { // Single day selected
            intervalType = "day";
        } else if (diffDays <= 7 && type !== "period" && period !== "thisMonth" && period !== "allTime") { // Up to a week, but not if it's a specific "thisWeek" or "thisMonth" period, to use day
             intervalType = "day";
        }
        else if (diffDays <= 2 && type === "range") { // Custom range of 1 or 2 days
            intervalType = "day";
        } else if (diffDays > 60) { // More than ~2 months
            intervalType = "month";
        } else if (diffDays > 14) { // More than 2 weeks
            intervalType = "week";
        } else { // Default to day for shorter periods
            intervalType = "day";
        }
    }
    
    if (!startDate || !endDate) return [];

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
          Line chart showing cash inflow and expenses. Use filters to adjust the view.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value, currency, {notation: 'compact'})}`} />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name === 'cashIn' ? 'Cash In' : 'Expenses']}
            />
            <Legend wrapperStyle={{paddingTop: '10px'}} />
            <Line type="monotone" dataKey="cashIn" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Cash In" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name="Expenses" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

