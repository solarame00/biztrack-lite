
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, DateFilter, Currency, Project } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_CURRENCY_KEY = "biztrack_lite_currency";
const LOCAL_STORAGE_PROJECTS_KEY = "biztrack_lite_projects";
const LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY = "biztrack_lite_current_project_id";
const LOCAL_STORAGE_TRANSACTIONS_KEY = "biztrack_lite_transactions"; // Stores ALL transactions

const DEFAULT_PROJECT_ID = "default-project";

interface DataContextType {
  transactions: Transaction[]; // Filtered by current project
  allTransactions: Transaction[]; // All transactions for all projects (mainly for internal use/saving)
  addTransaction: (transaction: Omit<Transaction, "id" | "projectId">) => void;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  projects: Project[];
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string) => void;
  addProject: (project: Omit<Project, "id">) => string; // Returns new project ID
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null);
  const [filter, setFilter] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load currency
        const storedCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY) as Currency | null;
        if (storedCurrency) setCurrencyState(storedCurrency);

        // Load projects
        const storedProjectsString = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
        let loadedProjects: Project[] = storedProjectsString ? JSON.parse(storedProjectsString) : [];
        
        if (loadedProjects.length === 0) {
          loadedProjects = [{ id: DEFAULT_PROJECT_ID, name: "Default Project", description: "Your first project" }];
          localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(loadedProjects));
        }
        setProjects(loadedProjects);

        // Load current project ID
        let storedCurrentProjectId = localStorage.getItem(LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY);
        if (!storedCurrentProjectId || !loadedProjects.find(p => p.id === storedCurrentProjectId)) {
          storedCurrentProjectId = loadedProjects[0]?.id || null;
          if (storedCurrentProjectId) localStorage.setItem(LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY, storedCurrentProjectId);
        }
        setCurrentProjectIdState(storedCurrentProjectId);
        
        // Load all transactions
        const storedTransactionsString = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
        if (storedTransactionsString) {
            const parsedTransactions = JSON.parse(storedTransactionsString).map((t: any) => ({
                ...t,
                date: new Date(t.date) // Ensure date is a Date object
            }));
            setAllTransactions(parsedTransactions);
        } else {
            setAllTransactions([]);
        }

      } catch (e) {
        console.error("Failed to load data from localStorage", e);
        setError("Failed to load data. LocalStorage might be corrupted or inaccessible.");
        // Fallback to default if critical data is missing
        if (projects.length === 0) {
            const defaultProj = { id: DEFAULT_PROJECT_ID, name: "Default Project" };
            setProjects([defaultProj]);
            localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify([defaultProj]));
            setCurrentProjectIdState(DEFAULT_PROJECT_ID);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID);
        }
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []); // Empty dependency array: run once on mount


  const addTransaction = useCallback((transactionData: Omit<Transaction, "id" | "projectId">) => {
    if (!currentProjectId) {
      toast({ title: "Error", description: "No project selected. Cannot add transaction.", variant: "destructive"});
      return;
    }
    const newTransaction: Transaction = { 
      ...transactionData, 
      id: crypto.randomUUID(), 
      projectId: currentProjectId 
    };
    setAllTransactions((prevAllTransactions) => {
      const updatedAllTransactions = [...prevAllTransactions, newTransaction];
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedAllTransactions));
      return updatedAllTransactions;
    });
  }, [currentProjectId, toast]);

  const handleSetFilter = useCallback((newFilter: DateFilter) => {
    let updatedFilter = { ...newFilter };
    if (newFilter.type === "period" && newFilter.period) {
        const now = new Date();
        switch(newFilter.period) {
            case "today": updatedFilter.startDate = startOfDay(now); updatedFilter.endDate = endOfDay(now); break;
            case "thisWeek": updatedFilter.startDate = startOfWeek(now, { weekStartsOn: 1 }); updatedFilter.endDate = endOfWeek(now, { weekStartsOn: 1 }); break;
            case "thisMonth": updatedFilter.startDate = startOfMonth(now); updatedFilter.endDate = endOfMonth(now); break;
            case "allTime": updatedFilter.startDate = undefined; updatedFilter.endDate = undefined; break;
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

  const addProject = useCallback((projectData: Omit<Project, "id">): string => {
    const newProject: Project = { ...projectData, id: crypto.randomUUID() };
    setProjects((prevProjects) => {
      const updatedProjects = [...prevProjects, newProject];
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updatedProjects));
      return updatedProjects;
    });
    return newProject.id;
  }, []);

  const setCurrentProjectId = useCallback((projectId: string) => {
    setCurrentProjectIdState(projectId);
    localStorage.setItem(LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY, projectId);
  }, []);

  // Memoized transactions filtered by current project
  const transactionsForCurrentProject = useMemo(() => {
    if (!currentProjectId) return [];
    return allTransactions.filter(t => t.projectId === currentProjectId);
  }, [allTransactions, currentProjectId]);


  return (
    <DataContext.Provider value={{ 
      transactions: transactionsForCurrentProject, 
      allTransactions,
      addTransaction, 
      filter, 
      setFilter: handleSetFilter, 
      currency, 
      setCurrency: handleSetCurrency, 
      projects,
      currentProjectId,
      setCurrentProjectId,
      addProject,
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
