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
import { collection, getDocs, query, doc, setDoc, deleteDoc, writeBatch, getDoc, where, limit, FirestoreError } from "firebase/firestore";

// Local Storage Keys that remain
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
  isSignupAllowed: boolean; // New state to control signup
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
  const [isSignupAllowed, setIsSignupAllowed] = useState<boolean>(false); // Default to false until checked

  // Check if any user exists in the database to control signup visibility
  useEffect(() => {
    const checkFirstUser = async () => {
      if (!db) {
        // If DB is not ready, we can't check, assume signup is not allowed yet.
        // It will re-evaluate when db is available.
        return;
      }
      try {
        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef, limit(1));
        const querySnapshot = await getDocs(q);
        // If there are no documents in the 'users' collection, allow signup.
        setIsSignupAllowed(querySnapshot.empty);
      } catch (e: any) {
        console.error("Error checking for existing users:", e.message);
        // In case of error, disable signup to be safe
        setIsSignupAllowed(false);
        setError("Could not verify user status. Signup is disabled.");
      }
    };

    checkFirstUser();
  }, [db]); // Re-run if db instance changes

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

      // After a user signs up, allow subsequent logins to see the content.
      const usersCollectionRef = collection(db, "users");
      const userQuery = query(usersCollectionRef, limit(1));
      const userSnapshot = await getDocs(userQuery);
      setIsSignupAllowed(userSnapshot.empty);


      const storedCurrentProjectId = localStorage.getItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      let activeProjectId = storedCurrentProjectId;

      if (!activeProjectId || (loadedProjects.length > 0 && !loadedProjects.find((p: Project) => p.id === activeProjectId))) {
        activeProjectId = loadedProjects.length > 0 ? loadedProjects[0].id : null;
      }
      
      setCurrentProjectIdState(activeProjectId);
      if (activeProjectId) {
        localStorage.setItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId), activeProjectId);
      } else {
        localStorage.removeItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      }
      

      if (!activeProjectId) {
        setUserTransactions([]); // Clear transactions if no project is active
      }
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
      if (user) {
        setCurrentUser(user);
        await loadInitialUserData(user.uid);
      } else {
        setCurrentUser(null);
        setLoading(false); // No user, stop loading
        // Reset user-specific data
        setUserProjects([]);
        setUserTransactions([]);
        setCurrentProjectIdState(null);
      }
    }, (authError) => {
      console.error("Error in onAuthStateChanged (DataContext):", authError);
      setFirebaseInitErrorState(`Auth listener error: ${authError.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadInitialUserData]);


  const loadTransactionsForProject = useCallback(async (userId: string, projectId: string) => {
    if (!db) {
        setError("Database is not available.");
        return;
    }
    try {
      const transCollectionRef = collection(db, "users", userId, "projects", projectId, "transactions");
      const q = query(transCollectionRef);
      const querySnapshot = await getDocs(q);
      const loadedTransactions = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
              ...data,
              id: docSnapshot.id,
              date: (data.date as any).toDate(),
          } as Transaction;
      });
      setUserTransactions(loadedTransactions);
    } catch (e: any) {
      console.error(`Failed to load transactions for project ${projectId}:`, e.message);
      setError("Failed to load project transactions from database.");
      setUserTransactions([]);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentProjectId) {
      loadTransactionsForProject(currentUser.uid, currentProjectId);
    } else if (!currentProjectId && currentUser) {
        setUserTransactions([]);
    }
  }, [currentUser, currentProjectId, loadTransactionsForProject]);


  const addProject = useCallback(async (projectData: Omit<Project, "id" | "userId">): Promise<string | null> => {
    if (!currentUser || !db) {
      toast({ title: "Error", description: "User session not available or database unavailable.", variant: "destructive" });
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
      console.error("Failed to save project to Firestore:", e);
      let errorMessage = "Could not save project data to the database.";
      if (e instanceof FirestoreError && e.code === 'permission-denied') {
          errorMessage = "Permission Denied: Please check your Firestore security rules to allow writes for authenticated users.";
      }
      setError(errorMessage);
      toast({ title: "Project Creation Failed", description: errorMessage, variant: "destructive" });
      return null;
    }
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
        console.error("Failed to save current project ID to localStorage:", e.message);
        setError("Could not save current project preference.");
      }
    }
  }, [currentUser]);


  const addTransaction = useCallback(async (transactionData: Omit<Transaction, "id" | "projectId" | "userId">) => {
    if (!currentUser || !currentProjectId || !db) {
      toast({ title: "Error", description: "User session or project not available.", variant: "destructive"});
      return;
    }
    
    const newTransactionRef = doc(collection(db, "users", currentUser.uid, "projects", currentProjectId, "transactions"));
    const newTransaction: Transaction = {
      ...transactionData,
      id: newTransactionRef.id,
      projectId: currentProjectId,
      userId: currentUser.uid,
      date: new Date(transactionData.date)
    };
    
    try {
      await setDoc(newTransactionRef, { ...transactionData, date: newTransaction.date });
      setUserTransactions(prev => [...prev, newTransaction]);
    } catch (e: any) {
        console.error("Failed to save transaction to Firestore:", e.message);
        setError("Could not save transaction data.");
        toast({ title: "Error", description: "Failed to save transaction.", variant: "destructive" });
    }
  }, [currentUser, currentProjectId, toast]);


  const editTransaction = useCallback(async (transactionId: string, updatedPartialData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => {
    if (!currentUser || !currentProjectId || !db) return;

    const transactionRef = doc(db, "users", currentUser.uid, "projects", currentProjectId, "transactions", transactionId);
    const updatedDataWithDate = {
        ...updatedPartialData,
        date: new Date(updatedPartialData.date || new Date())
    };

    try {
        await setDoc(transactionRef, updatedDataWithDate, { merge: true });
        setUserTransactions(prev => prev.map(t => 
            t.id === transactionId ? { ...t, ...updatedDataWithDate } : t
        ));
        toast({ title: "Success", description: "Transaction updated.", className: "bg-primary text-primary-foreground" });
    } catch (e: any) {
        console.error("Failed to update transaction in Firestore:", e.message);
        setError("Could not update transaction data.");
        toast({ title: "Error", description: "Failed to update transaction.", variant: "destructive" });
    }
  }, [currentUser, currentProjectId, toast]);


  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!currentUser || !currentProjectId || !db) return;

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "projects", currentProjectId, "transactions", transactionId));
        setUserTransactions(prev => prev.filter(t => t.id !== transactionId));
        toast({ title: "Success", description: "Transaction deleted.", variant: "destructive" });
    } catch (e: any) {
        console.error("Failed to delete transaction from Firestore:", e.message);
        setError("Could not delete transaction data.");
        toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" });
    }
  }, [currentUser, currentProjectId, toast]);


  const deleteProject = useCallback(async (projectIdToDelete: string) => {
    if (!currentUser || !projectIdToDelete || !db) {
        toast({ title: "Error", description: "User not authenticated, no project specified, or database unavailable.", variant: "destructive" });
        return;
    }

    try {
      const projectRef = doc(db, "users", currentUser.uid, "projects", projectIdToDelete);
      const transactionsRef = collection(projectRef, "transactions");
      const transSnapshot = await getDocs(transactionsRef);
      const batch = writeBatch(db);
      transSnapshot.forEach(doc => batch.delete(doc.ref));
      batch.delete(projectRef);
      await batch.commit();

      setUserProjects(prevProjects => {
        const updatedProjects = prevProjects.filter(p => p.id !== projectIdToDelete);
        if (currentProjectId === projectIdToDelete) {
          const newCurrentId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
          setCurrentProjectId(newCurrentId); 
        }
        return updatedProjects;
      });
      toast({ title: "Project Deleted", description: "Project and all its data deleted.", variant: "destructive" });
    } catch (e: any) {
        console.error(`Failed to delete project ${projectIdToDelete} from Firestore:`, e.message);
        setError("Could not remove project data from database.");
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
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
      firebaseInitError: firebaseInitErrorState,
      isSignupAllowed,
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
