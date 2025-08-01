
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, Scale, TrendingUp, PiggyBank, Briefcase, Info, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types"; 
import { isWithinInterval } from 'date-fns';
import { formatCurrency } from "@/lib/currency-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const ensureDateObjects = (transactions: Transaction[]): Transaction[] => {
  return transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date) 
  }));
};


const filterTransactionsByDate = (transactions: Transaction[], filter: ReturnType<typeof useData>['filter']): Transaction[] => {
  // If the active filter is transactionType, we should ignore date filtering to show all transactions of that type
  if (filter.type === 'transactionType') {
    return transactions;
  }
  if (!filter.startDate && !filter.endDate && filter.type === "period" && filter.period === "allTime") {
    return transactions;
  }
  if (!filter.startDate || !filter.endDate) return transactions; 

  const ensuredTransactions = ensureDateObjects(transactions);

  return ensuredTransactions.filter(transaction => {
    const transactionDate = transaction.date; 
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};

interface HomeDashboardProps {
  onDrillDown: (transactionType: Transaction['type']) => void;
}


export function HomeDashboard({ onDrillDown }: HomeDashboardProps) {
  const { transactions: projectScopedTransactions, filter, loading: dataContextLoading, currency, currentProject } = useData();
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [netBalance, setNetBalance] = useState(0);

  const isBusinessProject = currentProject?.projectType === 'business';

  const dateFilteredTransactions = useMemo(() => {
    return filterTransactionsByDate(projectScopedTransactions, filter);
  }, [projectScopedTransactions, filter]);

  useEffect(() => {
    let currentTotalIncome = 0;
    let currentTotalExpenses = 0;

    dateFilteredTransactions.forEach(transaction => {
      if (transaction.type === "cash-in") {
        currentTotalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        currentTotalExpenses += transaction.amount;
      }
      // 'cash-out' is ignored for these summary calculations
    });

    setTotalIncome(currentTotalIncome);
    setTotalExpenses(currentTotalExpenses);
    setNetBalance(currentTotalIncome - currentTotalExpenses);
  }, [dateFilteredTransactions]);

  if (dataContextLoading || !currentProject) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Terminology based on project type
  const incomeTerm = isBusinessProject ? "Revenue" : "Total Income";
  const netTerm = isBusinessProject ? "Net Profit" : "Net Balance";
  const incomeDesc = isBusinessProject ? "Sum of all sales and services income" : "Sum of all cash-in transactions";
  const netDesc = isBusinessProject ? "Total revenue minus total expenses" : "Total income minus total expenses";

  return (
    <TooltipProvider>
      <div className={`grid gap-6 md:grid-cols-2 ${isBusinessProject ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        
        {/* Total Income / Revenue Card */}
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Card 
              className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => onDrillDown('cash-in')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {incomeTerm}
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                  {formatCurrency(totalIncome, currency)}
                </div>
                <p className="text-xs text-muted-foreground">{incomeDesc}</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view all {incomeTerm.toLowerCase()} transactions</p>
          </TooltipContent>
        </Tooltip>

        {/* Total Expenses Card */}
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Card 
              className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => onDrillDown('expense')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalExpenses, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Sum of all expenses for the period</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view all expense transactions</p>
          </TooltipContent>
        </Tooltip>


        {/* Net Profit / Net Balance Card */}
        <Card className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-primary">
                {netTerm}
              </CardTitle>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button><Info className="h-4 w-4 text-muted-foreground cursor-pointer" /></button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{netDesc}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Scale className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(netBalance, currency)}
            </div>
            <p className="text-xs text-primary/80">({incomeTerm}) - (Expenses)</p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
