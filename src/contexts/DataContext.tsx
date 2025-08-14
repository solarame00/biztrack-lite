

// src/contexts/DataContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, DateFilter, Currency, Project, TrackingPreference } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { db, auth, getFirebaseInitializationError } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, getDocs, query, doc, setDoc, deleteDoc, writeBatch, getDoc, where, limit, FirestoreError, updateDoc } from "firebase/firestore";

// Local Storage Keys that remain
const USER_CURRENT_PROJECT_ID_LS_KEY = (userId: string) => `biztrack_lite_user_${userId}_current_project_id`;


interface DataContextType {
  currentUser: User | null;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "projectId" | "userId">) => void;
  editTransaction: (transactionId: string, updatedData: Partial<Omit<Transaction, "id" | "projectId" | "userId" | "type">>) => void;
  deleteTransaction: (transactionId: string) => void;
  updateUserProfile: (profileData: { displayName: string }) => Promise<void>;
  filter: DateFilter;
  setFilter: (newFilter: DateFilter) => void;
  currency: Currency;
  projects: Project[];
  currentProjectId: string | null;
  currentProject: Project | null;
  setCurrentProjectId: (projectId: string | null) => void;
  addProject: (project: Omit<Project, "id" | "userId">) => Promise<string | null>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProjectSettings: (projectId: string, updates: Partial<Pick<Project, 'currency' | 'name' | 'description'>>) => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseInitErrorState, setFirebaseInitErrorState] = useState<string | null>(null);

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


  const loadInitialUserData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    try {
      // 1. Load Projects
      const projectsCollectionRef = collection(db, "users", userId, "projects");
      const projectsSnapshot = await getDocs(query(projectsCollectionRef));
      const loadedProjects: Project[] = projectsSnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
            id: docSnapshot.id,
            userId: userId,
            ...data,
            trackingPreference: data.trackingPreference || "revenueAndExpenses",
            currency: data.currency || "USD",
        } as Project;
      });
      setUserProjects(loadedProjects);

      // 2. Determine Active Project
      const storedCurrentProjectId = localStorage.getItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      let activeProjectId = storedCurrentProjectId;

      if (!activeProjectId || !loadedProjects.some(p => p.id === activeProjectId)) {
        activeProjectId = loadedProjects.length > 0 ? loadedProjects[0].id : null;
      }
      
      setCurrentProjectIdState(activeProjectId);
      if (activeProjectId) {
        localStorage.setItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId), activeProjectId);
      } else {
        localStorage.removeItem(USER_CURRENT_PROJECT_ID_LS_KEY(userId));
      }

      // 3. Load Transactions for the Active Project BEFORE finishing
      if (activeProjectId) {
        await loadTransactionsForProject(userId, activeProjectId);
      } else {
        setUserTransactions([]); // No active project, so no transactions
      }
    } catch (e: any) {
      console.error(`Failed to load initial user data for ${userId}:`, e.message);
      setError("Failed to load user projects from database.");
      setUserProjects([]);
      setUserTransactions([]);
      setCurrentProjectIdState(null);
    } finally {
      // 4. Mark loading as complete only after all steps are done
      setLoading(false);
    }
  }, [loadTransactionsForProject]);

  // Effect to handle user authentication state changes
  useEffect(() => {
    const initError = getFirebaseInitializationError();
    if (initError) {
      setFirebaseInitErrorState(initError);
      setLoading(false);
      return;
    }
    if (!auth) {
      const serviceUnavailableError = "Firebase Auth service is not available.";
      setFirebaseInitErrorState(serviceUnavailableError);
      setLoading(false);
      return;
    }

    setFirebaseInitErrorState(null);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        // User is logged in or just signed up
        const userDocRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            // This is a new user's first login, create their user document
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              createdAt: new Date(),
            });
          }
          // Now that user doc is guaranteed to exist, set user and load their data
          setCurrentUser(user);
          await loadInitialUserData(user.uid);

        } catch (e: any) {
           console.error("Error ensuring user document exists:", e);
           setFirebaseInitErrorState("Failed to access user data in database. Permissions might be incorrect.");
           setLoading(false);
        }
      } else {
        // User is logged out or db is not available
        if (!db) {
            setFirebaseInitErrorState("Database service is not available. Please check Firebase configuration.");
        }
        setCurrentUser(null);
        setLoading(false); // No user, stop loading
        // Reset all user-specific data
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


  // This effect now only handles SWITCHING projects, not the initial load.
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
      await setDoc(newProjectRef, { 
        name: newProject.name, 
        description: newProject.description, 
        projectType: newProject.projectType,
        trackingPreference: newProject.trackingPreference,
        currency: newProject.currency,
      });
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

  const updateUserProfile = useCallback(async (profileData: { displayName: string }) => {
    if (!auth?.currentUser || !db) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    try {
        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, { displayName: profileData.displayName });

        // Update Firestore user document
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, { displayName: profileData.displayName });
        
        // Manually update the user state in the context to reflect changes immediately
        setCurrentUser(auth.currentUser);

        toast({ title: "Profile Updated", description: "Your display name has been updated.", className: "bg-primary text-primary-foreground" });
    } catch (e: any) {
        console.error("Failed to update user profile:", e);
        setError("Could not update your profile data.");
        toast({ title: "Error", description: "Failed to update your profile.", variant: "destructive" });
    }
  }, [toast]);
  
  const updateProjectSettings = useCallback(async (projectId: string, updates: Partial<Pick<Project, 'currency' | 'name' | 'description'>>) => {
    if (!currentUser || !db) {
        toast({ title: "Error", description: "User session or database unavailable.", variant: "destructive"});
        return;
    }

    const projectRef = doc(db, "users", currentUser.uid, "projects", projectId);
    
    try {
      await updateDoc(projectRef, updates);
      setUserProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      toast({ title: "Project Updated", description: "Your project settings have been saved.", className: "bg-primary text-primary-foreground" });
    } catch (e: any) {
      console.error("Failed to update project settings:", e);
      setError("Could not save project settings.");
      toast({ title: "Error", description: "Failed to save project settings.", variant: "destructive" });
    }
  }, [currentUser, toast]);


  const handleSetFilter = useCallback((newFilter: DateFilter) => {
    let updatedFilter = { ...newFilter };
    const now = new Date();
    
    if (newFilter.type === "transactionType") {
      // For transaction type filters, we don't manage dates here, so just set it
      setFilterState(updatedFilter);
      return;
    }
    
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

  const transactionsToDisplay = useMemo(() => userTransactions, [userTransactions]);

  const currentProject = useMemo(() => {
    return userProjects.find(p => p.id === currentProjectId) || null;
  }, [userProjects, currentProjectId]);

  const currency = useMemo(() => {
    return currentProject?.currency || 'USD';
  }, [currentProject]);

  return (
    <DataContext.Provider value={{
      currentUser,
      transactions: transactionsToDisplay,
      addTransaction,
      editTransaction,
      deleteTransaction,
      updateUserProfile,
      updateProjectSettings,
      filter: filter,
      setFilter: handleSetFilter,
      currency,
      projects: userProjects,
      currentProjectId,
      currentProject,
      setCurrentProjectId,
      addProject,
      deleteProject,
      loading,
      error,
      firebaseInitError: firebaseInitErrorState,
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
