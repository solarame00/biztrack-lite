
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Scale } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types"; 
import { isWithinInterval } from 'date-fns';
import { formatCurrency } from "@/lib/currency-utils";

// Ensure transactions have dates as Date objects
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
    const transactionDate = transaction.date; // Already a Date object
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HomeDashboard() {
  const { transactions: projectTransactions, filter, loading: dataLoading, currency, currentProjectId } = useData();
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [componentLoading, setComponentLoading] = useState(true);

  // Filter transactions by date AFTER they are filtered by project ID in DataContext
  const dateFilteredTransactions = useMemo(() => {
    if (!currentProjectId) return [];
    return filterTransactionsByDate(projectTransactions, filter);
  }, [projectTransactions, filter, currentProjectId]);

  useEffect(() => {
    if (!currentProjectId) {
      setTotalExpenses(0);
      setNetBalance(0);
      setComponentLoading(false);
      return;
    }

    setComponentLoading(true);
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
    setComponentLoading(false);
  }, [dateFilteredTransactions, currentProjectId]);


  if (dataLoading || componentLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
              <Scale className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted-foreground/10 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!currentProjectId) {
     return (
        <div className="mt-6 text-center text-muted-foreground">
            <p>Please select or create a project to see its dashboard.</p>
        </div>
    );
  }


  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
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

      <Card className="shadow-md rounded-lg bg-primary/10 hover:shadow-xl transition-shadow duration-300">
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
