
"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { format, isWithinInterval } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Receipt, DollarSignIcon, Info } from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";

const getTransactionTypeFriendlyName = (type: Transaction["type"]): string => {
  switch (type) {
    case "expense": return "Expense";
    case "cash-in": return "Cash In";
    case "cash-out": return "Cash Out"; // Kept for historical data, though not addable
    default: const exhaustiveCheck: never = type; return "Transaction"; 
  }
};

const getTransactionIcon = (type: Transaction["type"]) => {
  switch (type) {
    case "expense": return <Receipt className="h-4 w-4 text-destructive" />;
    case "cash-in": return <ArrowUpCircle className="h-4 w-4 text-emerald-500" />;
    case "cash-out": return <ArrowDownCircle className="h-4 w-4 text-rose-500" />;
    default: const exhaustiveCheck: never = type; return <DollarSignIcon className="h-4 w-4 text-muted-foreground" />;
  }
};

const ensureDateObjects = (transactions: Transaction[]): Transaction[] => {
  return transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date)
  }));
};

const filterTransactionsByDate = (transactions: Transaction[], filter: ReturnType<typeof useData>['filter']): Transaction[] => {
   if (filter.type === "period" && filter.period === "allTime") {
    return transactions;
  }
  if (!filter.startDate || !filter.endDate) {
      return transactions; 
  }

  const ensuredTransactions = ensureDateObjects(transactions);

  return ensuredTransactions.filter(transaction => {
    const transactionDate = transaction.date; // Already a Date object
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HistoryView() {
  const { transactions: projectTransactions, filter, loading, currency, currentProjectId } = useData();

  const filteredAndSortedTransactions = useMemo(() => {
    if (!currentProjectId) return [];
    const dateFiltered = filterTransactionsByDate(projectTransactions, filter);
    return dateFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectTransactions, filter, currentProjectId]);

  if (loading) {
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">Transaction History</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
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
  
  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl mt-6">
            <CardHeader>
                <CardTitle className="text-2xl">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Please select a project to view its history.</p>
            </CardContent>
        </Card>
    );
  }


  if (!filteredAndSortedTransactions.length) {
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">Transaction History</CardTitle>
          <CardDescription>All your recorded transactions for this project will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions found for the selected project and filter.</p>
            <p className="text-sm text-muted-foreground">Try adjusting the filters or adding new transactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl mt-6">
      <CardHeader>
        <CardTitle className="text-2xl">Transaction History</CardTitle>
        <CardDescription>A chronological list of all cash and expense movements for the current project.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Name / Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                  <TableCell className="font-medium">
                    {transaction.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 capitalize">
                       {getTransactionIcon(transaction.type)}
                       {getTransactionTypeFriendlyName(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'expense' || transaction.type === 'cash-out' ? 'text-destructive' : (transaction.type === 'cash-in' ? 'text-emerald-500' : '')}`}>
                    {transaction.type === 'expense' || transaction.type === 'cash-out' ? "-" : transaction.type === 'cash-in' ? "+" : ""}
                    {formatCurrency(transaction.amount, currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {transaction.note ? (
                        <div className="flex items-center gap-1">
                            <Info className="h-4 w-4 text-primary flex-shrink-0" /> 
                            <span title={transaction.note}>{transaction.note}</span>
                        </div>
                    ) : (
                        <span className="italic">No note</span>
                    )}
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
