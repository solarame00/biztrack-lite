
"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Briefcase, Landmark, Package, Receipt, Scale, History, DollarSignIcon } from "lucide-react";
import { isWithinInterval } from 'date-fns';

const getTransactionTypeFriendlyName = (type: Transaction["type"]): string => {
  switch (type) {
    case "expense":
      return "Expense";
    case "asset":
      return "Asset";
    case "cash-in":
      return "Cash In";
    case "cash-out":
      return "Cash Out";
    default:
      return "Transaction";
  }
};

const getTransactionIcon = (type: Transaction["type"]) => {
  switch (type) {
    case "expense":
      return <Receipt className="h-4 w-4 text-destructive" />;
    case "asset":
      return <Package className="h-4 w-4 text-green-500" />;
    case "cash-in":
      return <ArrowUpCircle className="h-4 w-4 text-emerald-500" />;
    case "cash-out":
      return <ArrowDownCircle className="h-4 w-4 text-rose-500" />;
    default:
      return <DollarSignIcon className="h-4 w-4 text-muted-foreground" />;
  }
};

const filterTransactions = (transactions: Transaction[], filter: ReturnType<typeof useData>['filter']): Transaction[] => {
   if (filter.type === "period" && filter.period === "allTime") {
    return transactions;
  }
  if (!filter.startDate || !filter.endDate) return transactions; // Should not happen if filter is set correctly

  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HistoryView() {
  const { transactions, filter, loading } = useData();

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = filterTransactions(transactions, filter);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  if (loading) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Transaction History</CardTitle>
          <CardDescription>Loading all your recorded transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredAndSortedTransactions.length) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Transaction History</CardTitle>
          <CardDescription>All your recorded transactions will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions found for the selected filter.</p>
            <p className="text-sm text-muted-foreground">Try adjusting the filters or adding new transactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Transaction History</CardTitle>
        <CardDescription>A chronological list of all your expenses, assets, and cash movements.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead>Name / Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category / Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                  <TableCell className="font-medium">
                    {transaction.type === 'expense' || transaction.type === 'asset' ? transaction.name : (transaction.type === 'cash-in' || transaction.type === 'cash-out' ? transaction.source : 'N/A')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                       {getTransactionIcon(transaction.type)}
                       {getTransactionTypeFriendlyName(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'expense' || transaction.type === 'cash-out' ? 'text-destructive' : (transaction.type === 'cash-in' ? 'text-emerald-500' : '')}`}>
                    {transaction.type === 'expense' || transaction.type === 'cash-out' ? "-" : transaction.type === 'cash-in' ? "+" : ""}
                    ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                   <TableCell>
                    {transaction.type === 'expense' && transaction.category}
                    {(transaction.type === 'cash-in' || transaction.type === 'cash-out') && transaction.source}
                    {/* Assets don't have a category/source in this context, name is primary identifier */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
