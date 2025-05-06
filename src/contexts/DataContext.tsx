
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Transaction, DateFilter, Currency } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

const LOCAL_STORAGE_CURRENCY_KEY = "biztrack_lite_currency";

interface DataContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      // Load currency from localStorage
      const storedCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY) as Currency | null;
      if (storedCurrency) {
        setCurrencyState(storedCurrency);
      }
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

    if (newFilter.type === "period" && newFilter.period) {
        const now = new Date();
        switch(newFilter.period) {
            case "today":
                updatedFilter.startDate = startOfDay(now);
                updatedFilter.endDate = endOfDay(now);
                break;
            case "thisWeek":
                updatedFilter.startDate = startOfWeek(now, { weekStartsOn: 1 });
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

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, newCurrency);
  }, []);


  return (
    <DataContext.Provider value={{ 
      transactions, 
      addTransaction, 
      filter, 
      setFilter: handleSetFilter, 
      currency, 
      setCurrency: handleSetCurrency, 
      loading, 
      error 
    }}>
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
