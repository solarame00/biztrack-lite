
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, DollarSign, Landmark, Scale } from "lucide-react"; // Package icon removed
import { useState, useEffect, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types"; // Expense, CashTransaction, Asset types no longer needed individually here
import { isWithinInterval } from 'date-fns';

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
  const { transactions, filter, loading: dataLoading } = useData();
  
  const [realCash, setRealCash] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  // totalAssets state removed
  const [netBalance, setNetBalance] = useState(0);
  const [componentLoading, setComponentLoading] = useState(true);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filter);
  }, [transactions, filter]);

  useEffect(() => {
    setComponentLoading(true);
    let currentRealCash = 0;
    let currentTotalExpenses = 0;
    // currentTotalAssets removed

    filteredTransactions.forEach(transaction => {
      if (transaction.type === "cash-in") {
        currentRealCash += transaction.amount;
      } else if (transaction.type === "cash-out") {
        currentRealCash -= transaction.amount;
      } else if (transaction.type === "expense") {
        currentTotalExpenses += transaction.amount;
      }
      // Logic for "asset" type removed
    });

    setRealCash(currentRealCash);
    setTotalExpenses(currentTotalExpenses);
    // setTotalAssets removed
    setNetBalance(currentRealCash - currentTotalExpenses); // Net balance calculation updated
    setComponentLoading(false);
  }, [filteredTransactions]);


  if (dataLoading || componentLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6"> {/* Adjusted to lg:grid-cols-3 */}
        {[...Array(3)].map((_, i) => ( // Adjusted to 3 loading cards
          <Card key={i} className="shadow-md rounded-lg animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6"> {/* Adjusted to lg:grid-cols-3 */}
      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Real Cash
          </CardTitle>
          <Landmark className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${realCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Current liquid cash on hand</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Sum of all expenses logged</p>
        </CardContent>
      </Card>

      {/* Total Assets Card removed */}

      <Card className="shadow-md rounded-lg bg-primary/10 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Net Balance
          </CardTitle>
          <Scale className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-primary/80">Cash - Expenses</p> {/* Updated description for Net Balance */}
        </CardContent>
      </Card>
    </div>
  );
}
