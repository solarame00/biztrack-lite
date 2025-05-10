
// src/contexts/DataContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, DateFilter, Currency, Project } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { auth, getFirebaseInitializationError } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

// New Local Storage Key Naming Convention
const USER_PROJECTS_LS_KEY = (userId: string) => `biztrack_lite_user_${userId}_projects`;
const PROJECT_TRANSACTIONS_LS_KEY = (projectId: string) => `biztrack_lite_project_${projectId}_transactions`;
const USER_CURRENT_PROJECT_ID_LS_KEY = (userId: string) => `biztrack_lite_user_${userId}_current_project_id`;
const GLOBAL_CURRENCY_LS_KEY = "biztrack_lite_currency";


interface DataContextType {
  currentUser: User | null;
  transactions: Transaction[]; // Transactions for the current project of the current user
  addTransaction: (transaction: Omit<Transaction, "id" | "projectId" | "userId">) => void;
  editTransaction: (transactionId: string, updatedData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => void;
  deleteTransaction: (transactionId: string) => void;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  projects: Project[]; // Projects for the current user
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string | null) => void;
  addProject: (project: Omit<Project, "id" | "userId">) => string;
  deleteProject: (projectId: string) => void;
  loading: boolean; // Combined loading state for auth and initial data
  error: string | null;
  firebaseInitError: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]); // For the current project
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null);
  const [filter, setFilterState] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [loading, setLoading] = useState<boolean>(true); // True until auth state and initial data are resolved
  const [error, setError] = useState<string | null>(null);
  const [firebaseInitErrorState, setFirebaseInitErrorState] = useState<string | null>(null);

  // Load currency preference on initial mount
  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(GLOBAL_CURRENCY_LS_KEY) as Currency | null;
      if (storedCurrency) setCurrencyState(storedCurrency);
    } catch (e: any) {
      console.error("Failed to load currency from localStorage (DataContext):", e.message);
      setError("Failed to load currency preference.");
    }
  }, []);

  // Firebase Auth Listener & Initial User Data Load Trigger
  useEffect(() => {
    const initError = getFirebaseInitializationError();
    if (initError) {
      setFirebaseInitErrorState(initError);
      setLoading(false);
      return;
    }
    if (!auth) {
      const authUnavailableError = "Firebase Auth service is not available.";
      setFirebaseInitErrorState(authUnavailableError);
      setLoading(false);
      return;
    }

    setFirebaseInitErrorState(null);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true); // Start loading when auth state changes
      setCurrentUser(user);
      if (user) {
        loadInitialUserData(user.uid); // This will load projects and set currentProjectId
      } else {
        setUserProjects([]);
        setUserTransactions([]);
        setCurrentProjectIdState(null);
        setLoading(false); // No user, stop loading
      }
    }, (authError) => {
      console.error("Error in onAuthStateChanged (DataContext):", authError);
      setFirebaseInitErrorState(`Auth listener error: ${authError.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs once on mount

  // Load transactions when currentProjectId or currentUser changes
  useEffect(() => {
    if (currentUser && currentProjectId) {
      setLoading(true);
      loadTransactionsForProject(currentProjectId);
      // setLoading(false) will be called within loadTransactionsForProject or if it's not called
    } else if (!currentProjectId && currentUser) {
        // User is logged in but no project is selected (e.g. after deleting the last project)
        setUserTransactions([]);
        setLoading(false); // Stop loading as there are no transactions to fetch for a null project
    }
    // If no currentUser, loading is handled by the auth useEffect
  }, [currentUser, currentProjectId]);


  const loadInitialUserData = useCallback((userId: string) => {
    setLoading(true);
    try {
      const storedProjectsString = localStorage.getItem(USER_PROJECTS_LS_KEY(userId));
      const loadedProjects = storedProjectsString ? JSON.parse(storedProjectsString) : [];
      setUserProjects(loadedProjects);

      const storedCurrentProjectId = localStorage.getItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      let activeProjectId = storedCurrentProjectId;

      if (!activeProjectId || (loadedProjects.length > 0 && !loadedProjects.find((p: Project) => p.id === activeProjectId))) {
        activeProjectId = loadedProjects[0]?.id || null;
      }
      setCurrentProjectIdState(activeProjectId); // This will trigger the transaction loading useEffect

      // If no project ID is determined here (e.g., new user, no projects),
      // the transaction loading useEffect won't fetch transactions, and loading should be set to false.
      if (!activeProjectId) {
        setUserTransactions([]); // Ensure transactions are cleared if no project
        setLoading(false);
      }
      // If activeProjectId is set, loading will be handled by the transaction loading useEffect.
    } catch (e: any) {
      console.error(`Failed to load initial user data for ${userId}:`, e.message);
      setError("Failed to load user data.");
      setLoading(false);
    }
  }, []);


  const loadTransactionsForProject = useCallback((projectId: string) => {
    setLoading(true);
    try {
      const storedTransactionsString = localStorage.getItem(PROJECT_TRANSACTIONS_LS_KEY(projectId));
      const loadedTransactions = storedTransactionsString ? JSON.parse(storedTransactionsString).map((t: any) => ({ ...t, date: new Date(t.date) })) : [];
      setUserTransactions(loadedTransactions);
    } catch (e: any)      {
      console.error(`Failed to load transactions for project ${projectId}:`, e.message);
      setError("Failed to load project transactions.");
      setUserTransactions([]); // Clear transactions on error
    } finally {
      setLoading(false);
    }
  }, []);


  const addProject = useCallback((projectData: Omit<Project, "id" | "userId">): string => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      throw new Error("User not authenticated");
    }
    const newProject: Project = { ...projectData, id: crypto.randomUUID(), userId: currentUser.uid };
    
    setUserProjects(prevProjects => {
      const updatedProjects = [...prevProjects, newProject];
      try {
        localStorage.setItem(USER_PROJECTS_LS_KEY(currentUser.uid), JSON.stringify(updatedProjects));
      } catch (e: any) {
        console.error("Failed to save projects to localStorage:", e.message);
        setError("Could not save project data.");
        // Potentially revert state update if LS fails, or notify user more strongly
      }
      return updatedProjects;
    });
    return newProject.id;
  }, [currentUser, toast]);


  const setCurrentProjectId = useCallback((projectId: string | null) => {
    setCurrentProjectIdState(projectId);
    if (currentUser) {
      try {
        if (projectId) {
          localStorage.setItem(USER_CURRENT_PROJECT_ID_LS_KEY(currentUser.uid), projectId);
        } else {
          localStorage.removeItem(USER_CURRENT_PROJECT_ID_LS_KEY(currentUser.uid));
        }
      } catch (e: any) {
        console.error("Failed to save current project ID:", e.message);
        setError("Could not save current project preference.");
      }
    }
  }, [currentUser]);


  const addTransaction = useCallback((transactionData: Omit<Transaction, "id" | "projectId" | "userId">) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive"});
      return;
    }
    if (!currentProjectId) {
      toast({ title: "Error", description: "No project selected.", variant: "destructive"});
      return;
    }
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      projectId: currentProjectId,
      userId: currentUser.uid,
      date: new Date(transactionData.date)
    };
    
    setUserTransactions(prevTransactions => {
      const updatedTransactions = [...prevTransactions, newTransaction];
      try {
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
      } catch (e: any) {
        console.error("Failed to save transaction:", e.message);
        setError("Could not save transaction data.");
      }
      return updatedTransactions;
    });
  }, [currentUser, currentProjectId, toast]);


  const editTransaction = useCallback((transactionId: string, updatedPartialData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => {
    if (!currentUser || !currentProjectId) return;

    setUserTransactions(prevTransactions => {
      const updatedTransactions = prevTransactions.map(t =>
        t.id === transactionId
        ? { ...t, ...updatedPartialData, date: new Date(updatedPartialData.date || t.date) }
        : t
      );
      try {
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
        toast({ title: "Success", description: "Transaction updated.", className: "bg-primary text-primary-foreground" });
      } catch (e: any) {
        console.error("Failed to update transaction in localStorage:", e.message);
        setError("Could not update transaction data.");
        return prevTransactions; // Revert to previous state on LS error
      }
      return updatedTransactions;
    });
  }, [currentUser, currentProjectId, toast]);


  const deleteTransaction = useCallback((transactionId: string) => {
    if (!currentUser || !currentProjectId) return;

    setUserTransactions(prevTransactions => {
      const updatedTransactions = prevTransactions.filter(t => t.id !== transactionId);
      try {
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
        toast({ title: "Success", description: "Transaction deleted.", variant: "destructive" });
      } catch (e: any) {
        console.error("Failed to delete transaction from localStorage:", e.message);
        setError("Could not delete transaction data.");
        return prevTransactions; // Revert
      }
      return updatedTransactions;
    });
  }, [currentUser, currentProjectId, toast]);


  const deleteProject = useCallback((projectIdToDelete: string) => {
    if (!currentUser || !projectIdToDelete) return;

    // Delete transactions associated with the project
    try {
      localStorage.removeItem(PROJECT_TRANSACTIONS_LS_KEY(projectIdToDelete));
    } catch (e: any) {
      console.error(`Failed to delete transactions for project ${projectIdToDelete}:`, e.message);
      setError("Could not remove project's transaction data.");
      // Continue to delete project from user's list if this fails, or handle more gracefully
    }
    // If the deleted project was the current one, clear its transactions from state
    if (currentProjectId === projectIdToDelete) {
        setUserTransactions([]);
    }


    // Update user's project list
    setUserProjects(prevProjects => {
      const updatedProjects = prevProjects.filter(p => p.id !== projectIdToDelete);
      try {
        localStorage.setItem(USER_PROJECTS_LS_KEY(currentUser.uid), JSON.stringify(updatedProjects));
      } catch (e: any) {
        console.error("Failed to update project list in localStorage:", e.message);
        setError("Could not update project list.");
        return prevProjects; // Revert
      }

      // If the deleted project was the current one, select a new current project or null
      if (currentProjectId === projectIdToDelete) {
        const newCurrentId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
        setCurrentProjectId(newCurrentId); // This will also update LS for current project ID
      }
      return updatedProjects;
    });

    toast({ title: "Project Deleted", description: "Project and its data deleted.", variant: "destructive" });
  }, [currentUser, currentProjectId, toast, setCurrentProjectId]);


  const handleSetFilter = useCallback((newFilter: DateFilter) => {
    let updatedFilter = { ...newFilter };
    const now = new Date();
    if (newFilter.type === "period" && newFilter.period) {
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
            default: 
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
    } else { 
        updatedFilter.type = "period";
        updatedFilter.period = "allTime";
        updatedFilter.startDate = undefined;
        updatedFilter.endDate = undefined;
    }
    setFilterState(updatedFilter);
  }, []);

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(GLOBAL_CURRENCY_LS_KEY, newCurrency);
    } catch (e: any) {
      console.error("Failed to save currency to localStorage:", e.message);
      setError("Could not save currency preference.");
    }
  }, []);

  // Transactions displayed are already user and project scoped via `userTransactions` state
  const transactionsToDisplay = useMemo(() => userTransactions, [userTransactions]);

  return (
    <DataContext.Provider value={{
      currentUser,
      transactions: transactionsToDisplay,
      addTransaction,
      editTransaction,
      deleteTransaction,
      filter: filter,
      setFilter: handleSetFilter,
      currency,
      setCurrency: handleSetCurrency,
      projects: userProjects,
      currentProjectId,
      setCurrentProjectId,
      addProject,
      deleteProject,
      loading,
      error,
      firebaseInitError: firebaseInitErrorState
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
