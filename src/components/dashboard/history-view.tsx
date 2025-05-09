
"use client";

import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { format, isWithinInterval } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Receipt, DollarSignIcon, Info, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";
import { Button } from "@/components/ui/button";
import { EditTransactionModal } from "@/components/forms/edit-transaction-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getTransactionTypeFriendlyName = (type: Transaction["type"]): string => {
  switch (type) {
    case "expense": return "Expense";
    case "cash-in": return "Cash In";
    case "cash-out": return "Cash Out"; 
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
      // If start/end date are not set (e.g. "allTime" or initial state), return all
      return transactions; 
  }

  const ensuredTransactions = ensureDateObjects(transactions);

  return ensuredTransactions.filter(transaction => {
    const transactionDate = transaction.date; 
    // Ensure transactionDate is a valid Date object before comparison
    if (!(transactionDate instanceof Date && !isNaN(transactionDate.valueOf()))) {
        console.warn("Invalid date found in transaction:", transaction);
        return false; 
    }
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HistoryView() {
  // `transactions` from useData are already scoped to current user and current project
  const { transactions: projectScopedTransactions, filter, loading: dataContextLoading, currency, currentProjectId, deleteTransaction } = useData();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredAndSortedTransactions = useMemo(() => {
    // No need to check currentProjectId if projectScopedTransactions is already correct
    const dateFiltered = filterTransactionsByDate(projectScopedTransactions, filter);
    return dateFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectScopedTransactions, filter]);

  const handleDelete = (transactionId: string) => {
    if (currentProjectId) { // Ensure project context exists for deletion
        deleteTransaction(transactionId);
    } else {
        // This case should ideally not happen if UI disables actions without a project
        console.error("Attempted to delete transaction without a current project ID.");
    }
  };

  if (dataContextLoading && !currentProjectId) { // Context is loading initial user/project data
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
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
  
  if (!currentProjectId && !dataContextLoading) { // Not loading, but no project selected
    return (
        <Card className="shadow-lg rounded-xl mt-6">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Please select a project to view its history.</p>
            </CardContent>
        </Card>
    );
  }

  // At this point, currentProjectId should be set, or if not, it means the user has no projects.
  // `projectScopedTransactions` would be empty if no project is selected or if the selected project has no transactions.

  if (dataContextLoading && currentProjectId) { // Loading transactions for a selected project
     return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
          <CardDescription>Loading transactions for current project...</CardDescription>
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


  if (!filteredAndSortedTransactions.length && currentProjectId) { // Project selected, but no transactions match filters or exist
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
          <CardDescription className="text-sm sm:text-base">All your recorded transactions for this project will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">No transactions found for the selected project and filter.</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting the filters or adding new transactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Transaction History</CardTitle>
          <CardDescription className="text-sm sm:text-base">A chronological list of all cash and expense movements for the current project.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sm:w-[120px]">Date</TableHead>
                    <TableHead>Name / Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-0">Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-xs sm:text-sm">{format(new Date(transaction.date), "PP")}</TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {transaction.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 capitalize text-xs px-1.5 py-0.5 sm:text-sm sm:px-2.5 sm:py-0.5">
                           {getTransactionIcon(transaction.type)}
                           {getTransactionTypeFriendlyName(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-xs sm:text-sm ${transaction.type === 'expense' || transaction.type === 'cash-out' ? 'text-destructive' : (transaction.type === 'cash-in' ? 'text-emerald-500' : '')}`}>
                        {transaction.type === 'expense' || transaction.type === 'cash-out' ? "-" : transaction.type === 'cash-in' ? "+" : ""}
                        {formatCurrency(transaction.amount, currency)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground max-w-[100px] sm:max-w-xs truncate">
                        {transaction.note ? (
                            <div className="flex items-center gap-1">
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" /> 
                                <span title={transaction.note}>{transaction.note}</span>
                            </div>
                        ) : (
                            <span className="italic">No note</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)} className="mr-1 sm:mr-2 h-7 w-7 sm:h-8 sm:w-8">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the transaction:
                                <br />
                                <strong>{transaction.name}</strong> - {formatCurrency(transaction.amount, currency)} on {format(new Date(transaction.date), "PP")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </>
  );
}

    