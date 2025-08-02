
"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import { TrendingDown } from "lucide-react";

// Predefined colors for the pie chart slices
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

export function ExpenseCategoryChart() {
  const { transactions, currency, loading: dataContextLoading } = useData();

  const chartData = React.useMemo(() => {
    const expenseData: { [key: string]: number } = {};

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseData[t.name] = (expenseData[t.name] || 0) + t.amount;
      });
    
    // Sort by amount descending and take top 6, lump rest into 'Other'
    const sortedExpenses = Object.entries(expenseData)
      .sort(([, a], [, b]) => b - a);

    const topExpenses = sortedExpenses.slice(0, 6);
    const otherExpenses = sortedExpenses.slice(6);
    
    let chartEntries = topExpenses.map(([name, value]) => ({ name, value }));
    
    if (otherExpenses.length > 0) {
      const otherValue = otherExpenses.reduce((sum, [, amount]) => sum + amount, 0);
      chartEntries.push({ name: 'Other', value: otherValue });
    }
    
    return chartEntries;

  }, [transactions]);

  if (dataContextLoading) {
     return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingDown className="h-6 w-6 text-primary"/>
                    <CardTitle className="text-2xl">Expense Breakdown</CardTitle>
                </div>
                <CardDescription>Analyzing expense categories...</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
                <div className="h-full w-full bg-muted rounded animate-pulse" />
            </CardContent>
        </Card>
     );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingDown className="h-6 w-6 text-primary"/>
                <CardTitle className="text-2xl">Expense Breakdown</CardTitle>
            </div>
            <CardDescription>A pie chart showing the distribution of your expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No expense data to display for this project.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-primary"/>
            <CardTitle className="text-2xl">Expense Breakdown</CardTitle>
        </div>
        <CardDescription>
            A pie chart showing the distribution of your expenses by category.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number) => formatCurrency(value, currency)}
            />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '20px'}}/>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
