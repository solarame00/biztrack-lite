
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Scale, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types"; 
import { isWithinInterval } from 'date-fns';
import { formatCurrency } from "@/lib/currency-utils";
import { Skeleton } from "@/components/ui/skeleton";

const ensureDateObjects = (transactions: Transaction[]): Transaction[] => {
  return transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date) 
  }));
};


const filterTransactionsByDate = (transactions: Transaction[], filter: ReturnType<typeof useData>['filter']): Transaction[] => {
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


export function HomeDashboard() {
  const { transactions: projectScopedTransactions, filter, loading: dataContextLoading, currency } = useData();
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);

  const dateFilteredTransactions = useMemo(() => {
    return filterTransactionsByDate(projectScopedTransactions, filter);
  }, [projectScopedTransactions, filter]);

  useEffect(() => {
    let currentRealCash = 0;
    let currentTotalExpenses = 0;

    dateFilteredTransactions.forEach(transaction => {
      if (transaction.type === "cash-in") {
        currentRealCash += transaction.amount;
      } else if (transaction.type === "cash-out") {
        currentRealCash -= transaction.amount; 
      } else if (transaction.type === "expense") {
        currentTotalExpenses += transaction.amount;
      }
    });

    setTotalExpenses(currentTotalExpenses);
    setNetBalance(currentRealCash - currentTotalExpenses);
  }, [dateFilteredTransactions]);


  if (dataContextLoading && !projectScopedTransactions.length) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-5" />
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
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Sum of all expenses logged for the period</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Net Balance
          </CardTitle>
          <Scale className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(netBalance, currency)}
          </div>
          <p className="text-xs text-primary/80">(Cash In) - Expenses for the period</p>
        </CardContent>
      </Card>
    </div>
  );
}

    