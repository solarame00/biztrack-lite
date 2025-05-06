
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Scale } from "lucide-react"; // DollarSign, Landmark removed
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types"; 
import { isWithinInterval } from 'date-fns';
import { formatCurrency } from "@/lib/currency-utils";

const filterTransactions = (transactions: Transaction[], filter: typeof useData extends () => infer U ? U['filter'] : never): Transaction[] => {
  if (!filter.startDate && !filter.endDate && filter.type === "period" && filter.period === "allTime") {
    return transactions;
  }
  if (!filter.startDate || !filter.endDate) return transactions; 

  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HomeDashboard() {
  const { transactions, filter, loading: dataLoading, currency } = useData();
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [componentLoading, setComponentLoading] = useState(true);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filter);
  }, [transactions, filter]);

  useEffect(() => {
    setComponentLoading(true);
    let currentRealCash = 0;
    let currentTotalExpenses = 0;

    filteredTransactions.forEach(transaction => {
      if (transaction.type === "cash-in") {
        currentRealCash += transaction.amount;
      } else if (transaction.type === "cash-out") {
        // Cash-out is no longer added from form, but old data might exist
        currentRealCash -= transaction.amount; 
      } else if (transaction.type === "expense") {
        currentTotalExpenses += transaction.amount;
      }
    });

    // Real cash is implicitly calculated for net balance, but not displayed directly
    setTotalExpenses(currentTotalExpenses);
    setNetBalance(currentRealCash - currentTotalExpenses);
    setComponentLoading(false);
  }, [filteredTransactions]);


  if (dataLoading || componentLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mt-6"> {/* Changed to md:grid-cols-2 */}
        {[...Array(2)].map((_, i) => ( // Changed to Array(2)
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


  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6"> {/* Changed to md:grid-cols-2 */}
      {/* Real Cash Card Removed */}

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
          <p className="text-xs text-primary/80">(Cash In - Cash Out) - Expenses for the period</p>
        </CardContent>
      </Card>
    </div>
  );
}

