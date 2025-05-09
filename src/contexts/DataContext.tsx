
// src/contexts/DataContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, DateFilter, Currency, Project } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { auth, getFirebaseInitializationError } from "@/lib/firebase"; // Import auth and error getter
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const LOCAL_STORAGE_CURRENCY_KEY = "biztrack_lite_currency";
const LOCAL_STORAGE_PROJECTS_KEY = "biztrack_lite_projects_all_users";
const LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY_PREFIX = "biztrack_lite_current_project_id_";
const LOCAL_STORAGE_TRANSACTIONS_KEY = "biztrack_lite_transactions_all_users";

interface DataContextType {
  currentUser: User | null;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "projectId" | "userId">) => void;
  editTransaction: (transactionId: string, updatedData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => void;
  deleteTransaction: (transactionId: string) => void;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  projects: Project[];
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string | null) => void;
  addProject: (project: Omit<Project, "id" | "userId">) => string;
  deleteProject: (projectId: string) => void;
  loading: boolean;
  error: string | null; // General data errors
  firebaseInitError: string | null; // Firebase specific initialization errors
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTransactionsGlobal, setAllTransactionsGlobal] = useState<Transaction[]>([]);
  const [projectsGlobal, setProjectsGlobal] = useState<Project[]>([]);
  
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null);
  const [filter, setFilterState] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseInitErrorState, setFirebaseInitErrorState] = useState<string | null>(null); 

  useEffect(() => {
    const initError = getFirebaseInitializationError();
    if (initError) {
      setFirebaseInitErrorState(initError);
      setLoading(false);
      setCurrentUser(null);
      return; 
    }

    if (!auth) {
      const authUnavailableError = "Firebase Auth service is not available in DataContext after firebase.ts initialization checks. This indicates a deeper issue with Firebase SDK setup or loading. The 'auth' object from 'firebase.ts' is undefined.";
      setFirebaseInitErrorState(authUnavailableError);
      console.error(authUnavailableError, "Auth object in DataContext:", auth);
      setLoading(false);
      setCurrentUser(null);
      return;
    }

    setFirebaseInitErrorState(null); 
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadUserSpecificData(user.uid);
      } else {
        setUserProjects([]);
        setUserTransactions([]);
        setCurrentProjectIdState(null);
      }
      setLoading(false); 
    }, (authError) => {
        console.error("Error in onAuthStateChanged listener (DataContext):", authError);
        setFirebaseInitErrorState(`Firebase Auth state listener error: ${authError.message}. Code: ${authError.code || 'N/A'}`);
        setLoading(false);
        setCurrentUser(null);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY) as Currency | null;
      if (storedCurrency) setCurrencyState(storedCurrency);

      const storedProjectsString = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (storedProjectsString) setProjectsGlobal(JSON.parse(storedProjectsString));
      
      const storedTransactionsString = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      if (storedTransactionsString) {
        setAllTransactionsGlobal(JSON.parse(storedTransactionsString).map((t: any) => ({ ...t, date: new Date(t.date) })));
      }
    } catch (e: any) {
      console.error("Failed to load global data from localStorage (DataContext):", e.message);
      setError("Failed to load global data. LocalStorage might be corrupted.");
    }
  }, []);


  const loadUserSpecificData = useCallback((userId: string) => {
    const currentUserProjects = projectsGlobal.filter(p => p.userId === userId);
    setUserProjects(currentUserProjects);

    const currentUserTransactions = allTransactionsGlobal.filter(t => t.userId === userId);
    setUserTransactions(currentUserTransactions);

    const userSpecificCurrentProjectIdKey = `${LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY_PREFIX}${userId}`;
    let storedCurrentProjectId = localStorage.getItem(userSpecificCurrentProjectIdKey);

    if (!storedCurrentProjectId || (currentUserProjects.length > 0 && !currentUserProjects.find(p => p.id === storedCurrentProjectId))) {
      storedCurrentProjectId = currentUserProjects[0]?.id || null;
    }
    
    setCurrentProjectIdState(storedCurrentProjectId);
    if (storedCurrentProjectId) {
        localStorage.setItem(userSpecificCurrentProjectIdKey, storedCurrentProjectId);
    } else if (userId) { 
        localStorage.removeItem(userSpecificCurrentProjectIdKey);
    }
  }, [projectsGlobal, allTransactionsGlobal]);

  const addProject = useCallback((projectData: Omit<Project, "id" | "userId">): string => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add a project.", variant: "destructive" });
      throw new Error("User not authenticated");
    }
    const newProject: Project = { ...projectData, id: crypto.randomUUID(), userId: currentUser.uid };
    
    setProjectsGlobal(prevGlobal => {
        const updatedGlobal = [...prevGlobal, newProject];
        try {
          localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save projects to localStorage:", e.message);
          setError("Could not save project data.");
        }
        return updatedGlobal;
    });
    setUserProjects(prevUser => [...prevUser, newProject]);
    return newProject.id;
  }, [currentUser, toast]);

  const setCurrentProjectId = useCallback((projectId: string | null) => {
    setCurrentProjectIdState(projectId);
    if (currentUser) {
      const userSpecificCurrentProjectIdKey = `${LOCAL_STORAGE_CURRENT_PROJECT_ID_KEY_PREFIX}${currentUser.uid}`;
      try {
        if (projectId) {
          localStorage.setItem(userSpecificCurrentProjectIdKey, projectId);
        } else {
          localStorage.removeItem(userSpecificCurrentProjectIdKey);
        }
      } catch (e: any) {
        console.error("Failed to save current project ID to localStorage:", e.message);
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
    
    setAllTransactionsGlobal(prevGlobal => {
        const updatedGlobal = [...prevGlobal, newTransaction];
        try {
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save transactions to localStorage:", e.message);
          setError("Could not save transaction data.");
        }
        return updatedGlobal;
    });
    setUserTransactions(prevUser => [...prevUser, newTransaction]);
  }, [currentUser, currentProjectId, toast]);

  const editTransaction = useCallback((transactionId: string, updatedData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => {
    if (!currentUser) return;

    setAllTransactionsGlobal(prevGlobal => {
        const updatedGlobal = prevGlobal.map(t =>
            t.id === transactionId && t.userId === currentUser.uid 
            ? { ...t, ...updatedData, date: new Date(updatedData.date || t.date) } 
            : t
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save transactions to localStorage after edit:", e.message);
          setError("Could not update transaction data.");
        }
        return updatedGlobal;
    });
    setUserTransactions(prevUser => prevUser.map(t => 
        t.id === transactionId 
        ? { ...t, ...updatedData, date: new Date(updatedData.date || t.date) } 
        : t
    ));
    toast({ title: "Success", description: "Transaction updated.", className: "bg-primary text-primary-foreground" });
  }, [currentUser, toast]);

  const deleteTransaction = useCallback((transactionId: string) => {
    if (!currentUser) return;

    setAllTransactionsGlobal(prevGlobal => {
        const updatedGlobal = prevGlobal.filter(t => !(t.id === transactionId && t.userId === currentUser.uid));
        try {
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save transactions to localStorage after delete:", e.message);
          setError("Could not delete transaction data.");
        }
        return updatedGlobal;
    });
    setUserTransactions(prevUser => prevUser.filter(t => t.id !== transactionId));
    toast({ title: "Success", description: "Transaction deleted.", variant: "destructive" });
  }, [currentUser, toast]);

  const deleteProject = useCallback((projectIdToDelete: string) => {
    if (!currentUser || !projectIdToDelete) return;

    setAllTransactionsGlobal(prevGlobal => {
        const updatedGlobal = prevGlobal.filter(t => !(t.projectId === projectIdToDelete && t.userId === currentUser.uid));
         try {
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save transactions to localStorage after project delete:", e.message);
          setError("Could not update transactions after project deletion.");
        }
        return updatedGlobal;
    });
    setUserTransactions(prevUser => prevUser.filter(t => t.projectId !== projectIdToDelete));

    setProjectsGlobal(prevGlobal => {
        const updatedGlobal = prevGlobal.filter(p => !(p.id === projectIdToDelete && p.userId === currentUser.uid));
        try {
          localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updatedGlobal));
        } catch (e: any) {
          console.error("Failed to save projects to localStorage after project delete:", e.message);
          setError("Could not update projects after project deletion.");
        }
        return updatedGlobal;
    });
    setUserProjects(prevUser => {
        const updatedUserProjects = prevUser.filter(p => p.id !== projectIdToDelete);
        if (currentProjectId === projectIdToDelete) {
            const newCurrentId = updatedUserProjects.length > 0 ? updatedUserProjects[0].id : null;
            setCurrentProjectId(newCurrentId); // This will also handle localStorage for currentProjectId
        }
        return updatedUserProjects;
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
      localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, newCurrency);
    } catch (e: any) {
      console.error("Failed to save currency to localStorage:", e.message);
      setError("Could not save currency preference.");
    }
  }, []);

  const transactionsForCurrentProjectAndUser = useMemo(() => {
    if (!currentProjectId || !currentUser) return [];
    return userTransactions.filter(t => t.projectId === currentProjectId && t.userId === currentUser.uid);
  }, [userTransactions, currentProjectId, currentUser]);

  return (
    <DataContext.Provider value={{
      currentUser,
      transactions: transactionsForCurrentProjectAndUser,
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
      error, // General errors from localStorage etc.
      firebaseInitError: firebaseInitErrorState // Firebase specific init errors
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

