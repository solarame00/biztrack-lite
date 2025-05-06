"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Transaction, DateFilter, FilterPeriod } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';


interface DataContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate initial data loading (e.g., from Firebase)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      // In a real app, fetch from Firebase here.
      // For now, we start with an empty array.
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate short delay
      setTransactions([]); 
      setLoading(false);
    };
    loadInitialData();
  }, []);


  const addTransaction = useCallback((transactionData: Omit<Transaction, "id">) => {
    setTransactions((prevTransactions) => [
      ...prevTransactions,
      { ...transactionData, id: crypto.randomUUID() },
    ]);
  }, []);

  const handleSetFilter = useCallback((newFilter: DateFilter) => {
    let updatedFilter = { ...newFilter };

    // Ensure date objects are consistently at the start of the day for period filters
    if (newFilter.type === "period" && newFilter.period) {
        const now = new Date();
        switch(newFilter.period) {
            case "today":
                updatedFilter.startDate = startOfDay(now);
                updatedFilter.endDate = endOfDay(now);
                break;
            case "thisWeek":
                updatedFilter.startDate = startOfWeek(now, { weekStartsOn: 1 }); // Assuming week starts on Monday
                updatedFilter.endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case "thisMonth":
                updatedFilter.startDate = startOfMonth(now);
                updatedFilter.endDate = endOfMonth(now);
                break;
            case "allTime":
                updatedFilter.startDate = undefined;
                updatedFilter.endDate = undefined;
                break;
        }
    } else if (newFilter.type === "date" && newFilter.specificDate) {
        updatedFilter.startDate = startOfDay(newFilter.specificDate);
        updatedFilter.endDate = endOfDay(newFilter.specificDate);
    } else if (newFilter.type === "range" && newFilter.startDate && newFilter.endDate) {
        updatedFilter.startDate = startOfDay(newFilter.startDate);
        updatedFilter.endDate = endOfDay(newFilter.endDate);
    }


    setFilter(updatedFilter);
  }, []);


  return (
    <DataContext.Provider value={{ transactions, addTransaction, filter, setFilter: handleSetFilter, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
