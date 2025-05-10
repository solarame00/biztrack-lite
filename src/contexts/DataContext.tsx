
// src/contexts/DataContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, DateFilter, Currency, Project } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { db, auth, getFirebaseInitializationError } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

// Local Storage Keys that remain
const PROJECT_TRANSACTIONS_LS_KEY = (projectId: string) => `biztrack_lite_project_${projectId}_transactions`;
const USER_CURRENT_PROJECT_ID_LS_KEY = (userId: string) => `biztrack_lite_user_${userId}_current_project_id`;
const GLOBAL_CURRENCY_LS_KEY = "biztrack_lite_currency";


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
  addProject: (project: Omit<Project, "id" | "userId">) => Promise<string | null>;
  deleteProject: (projectId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  firebaseInitError: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null);
  const [filter, setFilterState] = useState<DateFilter>({ type: "period", period: "allTime" });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseInitErrorState, setFirebaseInitErrorState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(GLOBAL_CURRENCY_LS_KEY) as Currency | null;
      if (storedCurrency) setCurrencyState(storedCurrency);
    } catch (e: any) {
      console.error("Failed to load currency from localStorage (DataContext):", e.message);
      setError("Failed to load currency preference.");
    }
  }, []);

  const loadInitialUserData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      if (!db) {
        throw new Error("Firestore database is not initialized.");
      }
      const projectsCollectionRef = collection(db, "users", userId, "projects");
      const q = query(projectsCollectionRef);
      const querySnapshot = await getDocs(q);
      
      const loadedProjects: Project[] = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        userId: userId,
        ...docSnapshot.data(),
      } as Project));
      setUserProjects(loadedProjects);

      const storedCurrentProjectId = localStorage.getItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      let activeProjectId = storedCurrentProjectId;

      if (!activeProjectId || (loadedProjects.length > 0 && !loadedProjects.find((p: Project) => p.id === activeProjectId))) {
        activeProjectId = loadedProjects.length > 0 ? loadedProjects[0].id : null;
      }
      
      // Set current project ID state. This might trigger transaction loading.
      // No need to call setCurrentProjectId here as that's for user actions.
      // This directly sets the state and updates localStorage if needed.
      setCurrentProjectIdState(activeProjectId);
      if (activeProjectId) {
        localStorage.setItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId), activeProjectId);
      } else {
        localStorage.removeItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      }
      

      if (!activeProjectId) {
        setUserTransactions([]); // Clear transactions if no project is active
      }
      // Transaction loading will be triggered by the useEffect watching currentProjectId
    } catch (e: any) {
      console.error(`Failed to load initial user data for ${userId}:`, e.message);
      setError("Failed to load user projects from database.");
      setUserProjects([]);
      setUserTransactions([]);
      setCurrentProjectIdState(null);
    } finally {
      setLoading(false);
    }
  }, []);


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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadInitialUserData(user.uid);
      } else {
        setUserProjects([]);
        setUserTransactions([]);
        setCurrentProjectIdState(null);
        setLoading(false);
      }
    }, (authError) => {
      console.error("Error in onAuthStateChanged (DataContext):", authError);
      setFirebaseInitErrorState(`Auth listener error: ${authError.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadInitialUserData]);

  const loadTransactionsForProject = useCallback((projectId: string) => {
    // setLoading(true); // This loading state might be better handled by UI components that consume transactions
    try {
      const storedTransactionsString = localStorage.getItem(PROJECT_TRANSACTIONS_LS_KEY(projectId));
      const loadedTransactions = storedTransactionsString ? JSON.parse(storedTransactionsString).map((t: any) => ({ ...t, date: new Date(t.date) })) : [];
      setUserTransactions(loadedTransactions);
    } catch (e: any)      {
      console.error(`Failed to load transactions for project ${projectId}:`, e.message);
      setError("Failed to load project transactions from local storage."); // Placeholder, will be Firestore soon
      setUserTransactions([]);
    } finally {
      // setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentProjectId) {
      loadTransactionsForProject(currentProjectId);
    } else if (!currentProjectId && currentUser) {
        setUserTransactions([]);
    }
  }, [currentUser, currentProjectId, loadTransactionsForProject]);


  const addProject = useCallback(async (projectData: Omit<Project, "id" | "userId">): Promise<string | null> => {
    if (!currentUser || !db) {
      toast({ title: "Error", description: "User not authenticated or database unavailable.", variant: "destructive" });
      return null;
    }
    const newProjectRef = doc(collection(db, "users", currentUser.uid, "projects"));
    const newProject: Project = { 
      ...projectData, 
      id: newProjectRef.id, 
      userId: currentUser.uid 
    };
    
    try {
      await setDoc(newProjectRef, { name: newProject.name, description: newProject.description });
      setUserProjects(prevProjects => [...prevProjects, newProject]);
      return newProject.id;
    } catch (e: any) {
      console.error("Failed to save project to Firestore:", e.message);
      setError("Could not save project data to database.");
      toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast, db]);


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
    
    setUserTransactions(prevTransactions => {
      const updatedTransactions = [...prevTransactions, newTransaction];
      try {
        // TODO: Migrate transactions to Firestore under /users/{userId}/projects/{projectId}/transactions
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
      } catch (e: any) {
        console.error("Failed to save transaction to localStorage:", e.message);
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
        // TODO: Migrate transactions to Firestore
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
        toast({ title: "Success", description: "Transaction updated.", className: "bg-primary text-primary-foreground" });
      } catch (e: any) {
        console.error("Failed to update transaction in localStorage:", e.message);
        setError("Could not update transaction data.");
        return prevTransactions;
      }
      return updatedTransactions;
    });
  }, [currentUser, currentProjectId, toast]);


  const deleteTransaction = useCallback((transactionId: string) => {
    if (!currentUser || !currentProjectId) return;

    setUserTransactions(prevTransactions => {
      const updatedTransactions = prevTransactions.filter(t => t.id !== transactionId);
      try {
        // TODO: Migrate transactions to Firestore
        localStorage.setItem(PROJECT_TRANSACTIONS_LS_KEY(currentProjectId), JSON.stringify(updatedTransactions));
        toast({ title: "Success", description: "Transaction deleted.", variant: "destructive" });
      } catch (e: any) {
        console.error("Failed to delete transaction from localStorage:", e.message);
        setError("Could not delete transaction data.");
        return prevTransactions;
      }
      return updatedTransactions;
    });
  }, [currentUser, currentProjectId, toast]);


  const deleteProject = useCallback(async (projectIdToDelete: string) => {
    if (!currentUser || !projectIdToDelete || !db) {
        toast({ title: "Error", description: "User not authenticated, no project specified, or database unavailable.", variant: "destructive" });
        return;
    }

    try {
      // TODO: Delete transactions subcollection for this project in Firestore
      localStorage.removeItem(PROJECT_TRANSACTIONS_LS_KEY(projectIdToDelete));
      if (currentProjectId === projectIdToDelete) {
          setUserTransactions([]);
      }

      await deleteDoc(doc(db, "users", currentUser.uid, "projects", projectIdToDelete));

      setUserProjects(prevProjects => {
        const updatedProjects = prevProjects.filter(p => p.id !== projectIdToDelete);
        if (currentProjectId === projectIdToDelete) {
          const newCurrentId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
          setCurrentProjectId(newCurrentId); 
        }
        return updatedProjects;
      });
      toast({ title: "Project Deleted", description: "Project and its data deleted.", variant: "destructive" });
    } catch (e: any) {
        console.error(`Failed to delete project ${projectIdToDelete} from Firestore:`, e.message);
        setError("Could not remove project data from database.");
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
  }, [currentUser, currentProjectId, toast, setCurrentProjectId, db]);


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

