
"use client";

import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Clock, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Receipt, DollarSignIcon } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "../ui/skeleton";


const getTransactionIcon = (type: Transaction["type"]) => {
  switch (type) {
    case "expense": return <Receipt className="h-4 w-4 text-destructive" />;
    case "cash-in": return <ArrowUpCircle className="h-4 w-4 text-emerald-500" />;
    case "cash-out": return <ArrowDownCircle className="h-4 w-4 text-rose-500" />;
    default: return <DollarSignIcon className="h-4 w-4 text-muted-foreground" />;
  }
};


export function LiveProjectSummary() {
  const { transactions, currency, currentProject, loading } = useData();

  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    let currentTotalIncome = 0;
    let currentTotalExpenses = 0;
    transactions.forEach(transaction => {
      if (transaction.type === "cash-in") {
        currentTotalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        currentTotalExpenses += transaction.amount;
      }
    });
    return {
      totalIncome: currentTotalIncome,
      totalExpenses: currentTotalExpenses,
      netBalance: currentTotalIncome - currentTotalExpenses,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const incomeTerm = currentProject?.projectType === 'business' ? "Revenue" : "Income";
  const netTerm = currentProject?.projectType === 'business' ? "Net Profit" : "Net Balance";

   if (loading || !currentProject) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-8 w-40" />
                     <Skeleton className="h-5 w-32" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div>
                                    <Skeleton className="h-5 w-24 mb-1" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Scale className="h-5 w-5 text-primary" />
            Live Project Snapshot
          </CardTitle>
          <CardDescription>An overview of the project's current financial standing based on all transactions.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="rounded-lg p-3 bg-background">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4 text-emerald-500" /> {incomeTerm}</p>
                <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-500">{formatCurrency(totalIncome, currency)}</p>
            </div>
             <div className="rounded-lg p-3 bg-background">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingDown className="h-4 w-4 text-destructive" /> Expenses</p>
                <p className="font-semibold text-lg text-destructive">{formatCurrency(totalExpenses, currency)}</p>
            </div>
             <div className="rounded-lg p-3 bg-background">
                <p className="text-sm text-muted-foreground">{netTerm}</p>
                <p className={`font-semibold text-lg ${netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(netBalance, currency)}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
            </CardTitle>
        </CardHeader>
        <CardContent>
            {recentTransactions.length > 0 ? (
                <ScrollArea className="h-[250px] pr-3">
                    <ul className="space-y-4">
                        {recentTransactions.map(t => (
                            <li key={t.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-full border">
                                        {getTransactionIcon(t.type)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{t.name}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <Badge variant={t.type === 'expense' || t.type === 'cash-out' ? 'destructive' : 'secondary'} className={`${t.type === 'cash-in' ? 'text-emerald-600 dark:text-emerald-500' : ''}`}>
                                    {t.type === 'expense' || t.type === 'cash-out' ? '-' : '+'}
                                    {formatCurrency(t.amount, currency)}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            ) : (
                <p className="text-center text-muted-foreground py-8">No recent transactions to show.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
