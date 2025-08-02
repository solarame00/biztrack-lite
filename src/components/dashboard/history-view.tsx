
"use client";

import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { format, isWithinInterval } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Receipt, DollarSignIcon, Info, Edit, Trash2, FileDown } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

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
      return transactions; 
  }

  const ensuredTransactions = ensureDateObjects(transactions);

  return ensuredTransactions.filter(transaction => {
    const transactionDate = transaction.date; 
    if (!(transactionDate instanceof Date && !isNaN(transactionDate.valueOf()))) {
        console.warn("Invalid date found in transaction:", transaction);
        return false; 
    }
    return isWithinInterval(transactionDate, { start: filter.startDate!, end: filter.endDate! });
  });
};


export function HistoryView() {
  const { transactions: projectScopedTransactions, filter, loading: dataContextLoading, currency, currentProject, deleteTransaction } = useData();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const isMobile = useIsMobile();

  const filteredAndSortedTransactions = useMemo(() => {
    let finalTransactions = projectScopedTransactions;

    // Apply date filtering first
    if (filter.type === 'period' || filter.type === 'date' || filter.type === 'range') {
      finalTransactions = filterTransactionsByDate(finalTransactions, filter);
    }
    
    // Then, if a transactionType filter is active, apply it
    if (filter.type === 'transactionType' && filter.transactionType) {
      finalTransactions = finalTransactions.filter(t => t.type === filter.transactionType);
    }

    return finalTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectScopedTransactions, filter]);

  const handleDelete = (transactionId: string) => {
    if (currentProject?.id) {
        deleteTransaction(transactionId);
    } else {
        console.error("Attempted to delete transaction without a current project ID.");
    }
  };
  
  const cardTitle = useMemo(() => {
    if (filter.type === 'transactionType') {
      if (filter.transactionType === 'expense') return "Expense History";
      if (filter.transactionType === 'cash-in') return "Income / Revenue History";
    }
    return "Full Transaction History";
  }, [filter]);

  const cardDescription = useMemo(() => {
    if (filter.type === 'transactionType') {
      if (filter.transactionType === 'expense') return "A list of all expense transactions for this project.";
      if (filter.transactionType === 'cash-in') return "A list of all income/revenue transactions for this project.";
    }
    return "A chronological list of all cash and expense movements for the current project.";
  }, [filter]);

  const handleExportCSV = () => {
    const headers = ["Date", "Name", "Type", "Amount", "Currency", "Note"];
    const csvContent = [
        headers.join(","),
        ...filteredAndSortedTransactions.map(t => [
            format(new Date(t.date), "yyyy-MM-dd"),
            `"${t.name.replace(/"/g, '""')}"`, // Escape quotes
            t.type,
            t.amount,
            currency,
            `"${(t.note || "").replace(/"/g, '""')}"` // Escape quotes
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const projectName = currentProject?.name.replace(/ /g, "_") || "Export";
    const date = format(new Date(), "yyyy-MM-dd");
    link.setAttribute("download", `BizTrack_${projectName}_Export_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const HeaderActions = () => (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExportCSV} 
      disabled={filteredAndSortedTransactions.length === 0 || loading.dataContextLoading}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export to CSV
    </Button>
  );


  const MobileHistoryCard = ({ transaction }: { transaction: Transaction }) => (
    <Card className="mb-4 shadow-md">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{transaction.name}</CardTitle>
                    <CardDescription>{format(new Date(transaction.date), "PPP")}</CardDescription>
                </div>
                 <Badge variant="outline" className="flex items-center gap-1 capitalize shrink-0">
                    {getTransactionIcon(transaction.type)}
                    {getTransactionTypeFriendlyName(transaction.type)}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <p className={`text-xl font-semibold ${transaction.type === 'expense' || transaction.type === 'cash-out' ? 'text-destructive' : (transaction.type === 'cash-in' ? 'text-emerald-500' : '')}`}>
                {transaction.type === 'expense' || transaction.type === 'cash-out' ? "-" : transaction.type === 'cash-in' ? "+" : ""}
                {formatCurrency(transaction.amount, currency)}
            </p>
             {transaction.note && (
                <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 text-primary flex-shrink-0 mt-1" /> 
                    <p className="break-words">{transaction.note}</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingTransaction(transaction)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
        </CardFooter>
    </Card>
  );

  const DesktopHistoryTable = () => (
    <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </div>
          <HeaderActions />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="transition-colors hover:bg-muted/50">
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
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {transaction.note ? (
                          <div className="flex items-center gap-1">
                              <Info className="h-4 w-4 text-primary flex-shrink-0" /> 
                              <span title={transaction.note}>{transaction.note}</span>
                          </div>
                      ) : (
                          <span className="italic">No note</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
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
          </ScrollArea>
        </CardContent>
    </Card>
  );
  
  const SkeletonCard = () => (
    <Card className="mb-4 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
            </div>
             <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-4" />
        <div className="flex items-start gap-2 mt-2">
            <Skeleton className="h-4 w-4 rounded-full mt-1" />
            <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
      </CardFooter>
    </Card>
  );

  const SkeletonTable = () => (
    <Card className="shadow-lg rounded-xl">
        <CardHeader>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-20 text-right" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 text-right" />
                </div>
            ))}
            </div>
        </CardContent>
    </Card>
  );


  if (dataContextLoading && !projectScopedTransactions.length) {
    return isMobile ? (
         <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{cardTitle}</CardTitle>
                  <CardDescription>{cardDescription}</CardDescription>
                </div>
                 <HeaderActions />
              </CardHeader>
            </Card>
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
         </div>
    ) : <SkeletonTable />
  }
  
  if (!filteredAndSortedTransactions.length) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <CardDescription>All your recorded transactions for this project will appear here.</CardDescription>
          </div>
          <HeaderActions />
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
    <>
        {isMobile ? (
             <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{cardTitle}</CardTitle>
                      <CardDescription>{cardDescription}</CardDescription>
                    </div>
                     <HeaderActions />
                  </CardHeader>
                </Card>
                {filteredAndSortedTransactions.map((transaction) => (
                    <MobileHistoryCard key={transaction.id} transaction={transaction} />
                ))}
             </div>
        ) : (
            <DesktopHistoryTable />
        )}

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
