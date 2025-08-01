
"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth/auth-button" 
import { FilterControls } from "@/components/dashboard/filter-controls"
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { AddProjectForm } from "@/components/projects/add-project-form"
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { Landmark, Receipt, DollarSignIcon, History, Settings, BarChart3, FolderPlus, AlertCircle, LogIn, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


// Import new tab content components
import { HomeTab } from "@/components/tabs/home-tab";
import { AddExpenseTab } from "@/components/tabs/add-expense-tab";
import { AddCashTab } from "@/components/tabs/add-cash-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { VisualsTab } from "@/components/tabs/visuals-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";

export default function HomePage() {
  const { currentUser, currentProjectId, loading: dataContextLoading, projects, setFilter } = useData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  if (dataContextLoading) { // This covers the initial app load spinner
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading BizTrack Lite...</p>
      </div>
    );
  }

  // If not loading and no user, show login prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">BizTrack Lite</CardTitle>
            <CardDescription>Sign in or create an account to manage your finances.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-muted-foreground">Your data is securely stored and tied to your account.</p>
            <Button onClick={() => router.push('/login')} size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleProjectCreated = () => {
    setIsSheetOpen(false); // Close the sheet
    setActiveTab("home");   // Switch to the home tab
  };
  
  const handleDrillDown = (transactionType: Transaction['type']) => {
    setFilter({ type: "transactionType", transactionType });
    setActiveTab("history");
  };


  // User is logged in, show main app content
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between p-4 space-x-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-xl sm:text-3xl font-bold text-primary">BizTrack Lite</h1>
            <div className="hidden sm:flex">
              <ProjectSwitcher />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <FolderPlus className="mr-2 h-5 w-5" />
                  New Project
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create a New Project</SheetTitle>
                  <SheetDescription>
                    Set up a new project to track its finances independently.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <AddProjectForm onProjectCreated={handleProjectCreated} />
                </div>
              </SheetContent>
            </Sheet>
            <AuthButton /> 
            <ThemeToggle />
          </div>
        </div>
        <div className="sm:hidden p-4 border-t">
            <ProjectSwitcher />
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        {/* Welcome / No Project Selected Banners */}
        {!currentProjectId && projects.length > 0 && (
          <Card className="shadow-lg rounded-xl mb-6 shrink-0 border-destructive bg-destructive/10">
              <CardHeader>
                  <CardTitle className="text-2xl flex items-center text-destructive"><AlertCircle className="mr-2 h-6 w-6" /> No Project Selected</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-destructive/90">Please select a project from the dropdown above to view its data, or create a new project.</p>
              </CardContent>
          </Card>
        )}
        {projects.length === 0 && (
            <Card className="shadow-lg rounded-xl mb-6 shrink-0 bg-primary/5 border-primary/20">
              <CardHeader>
                  <CardTitle className="text-2xl flex items-center"><FolderPlus className="mr-2 h-6 w-6 text-primary" /> Welcome, {currentUser.displayName || currentUser.email}!</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground mb-4">It looks like you don't have any projects yet. Create your first project to get started.</p>
                  {/* The form is now triggered by the sheet, but we can leave this as a visual cue or replace it */}
                   <Button onClick={() => setIsSheetOpen(true)}>
                      <FolderPlus className="mr-2 h-5 w-5" />
                      Create Your First Project
                  </Button>
              </CardContent>
          </Card>
        )}

        {/* Centralized Filter Controls */}
        {currentProjectId && <FilterControls />}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col mt-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 shrink-0">
            <TabsTrigger value="home" disabled={!currentProjectId}>
              <Landmark className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="add-expense" disabled={!currentProjectId}>
              <Receipt className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Add Expense</span>
            </TabsTrigger>
            <TabsTrigger value="add-cash" disabled={!currentProjectId}>
              <DollarSignIcon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
              <span className="hidden sm:inline">Add Cash</span>
            </TabsTrigger>
            <TabsTrigger value="history" disabled={!currentProjectId}>
              <History className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="visuals" disabled={!currentProjectId}>
              <BarChart3 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Visuals</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="flex-grow">
            <HomeTab onDrillDown={handleDrillDown}/>
          </TabsContent>
          <TabsContent value="add-expense" className="flex-grow">
            <AddExpenseTab />
          </TabsContent>
          <TabsContent value="add-cash" className="flex-grow">
            <AddCashTab />
          </TabsContent>
          <TabsContent value="history" className="flex-grow">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="visuals" className="flex-grow">
            <VisualsTab />
          </TabsContent>
          <TabsContent value="settings" className="flex-grow">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
