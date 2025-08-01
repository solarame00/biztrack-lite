
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth/auth-button" 
import { FilterControls } from "@/components/dashboard/filter-controls"
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { AddProjectForm } from "@/components/projects/add-project-form"
import { useData } from "@/contexts/DataContext";
import { Landmark, Receipt, DollarSignIcon, History, Settings, BarChart3, FolderPlus, AlertCircle, LogIn, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

// Import new tab content components
import { HomeTab } from "@/components/tabs/home-tab";
import { AddExpenseTab } from "@/components/tabs/add-expense-tab";
import { AddCashTab } from "@/components/tabs/add-cash-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { VisualsTab } from "@/components/tabs/visuals-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { AddProjectTab } from "@/components/tabs/add-project-tab";

export default function HomePage() {
  const { currentUser, currentProjectId, loading: dataContextLoading, projects } = useData();
  const router = useRouter();

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
        <Card className="w-full max-w-md shadow-xl">
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

  // User is logged in, show main app content
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-xl sm:text-3xl font-bold text-primary">BizTrack Lite</h1>
          <ProjectSwitcher />
        </div>
        <div className="flex items-center space-x-2">
          <AuthButton /> 
          <ThemeToggle />
        </div>
      </header>

      {/* Welcome / No Project Selected Banners */}
      {!currentProjectId && projects.length > 0 && (
         <Card className="shadow-lg rounded-xl mb-6 shrink-0">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><AlertCircle className="mr-2 h-6 w-6 text-destructive" /> No Project Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Please select a project from the dropdown above to view its data, or create a new project.</p>
            </CardContent>
         </Card>
      )}
      {projects.length === 0 && (
           <Card className="shadow-lg rounded-xl mb-6 shrink-0">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><FolderPlus className="mr-2 h-6 w-6 text-primary" /> Welcome, {currentUser.displayName || currentUser.email}!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">It looks like you don't have any projects yet. Create your first project to get started.</p>
                <AddProjectForm />
            </CardContent>
         </Card>
      )}

      {/* Centralized Filter Controls */}
      {currentProjectId && <FilterControls />}
      
      <Tabs defaultValue="home" className="w-full flex-grow flex flex-col mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 mb-6 shrink-0">
          <TabsTrigger value="home" disabled={!currentProjectId}>
            <Landmark className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger value="add-expense" disabled={!currentProjectId}>
            <Receipt className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
             <span className="hidden sm:inline">Add Expense</span>
             <span className="sm:hidden">Expense</span>
          </TabsTrigger>
          <TabsTrigger value="add-cash" disabled={!currentProjectId}>
             <DollarSignIcon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
             <span className="hidden sm:inline">Add Cash</span>
             <span className="sm:hidden">Cash</span>
          </TabsTrigger>
          <TabsTrigger value="history" disabled={!currentProjectId}>
            <History className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">Log</span>
          </TabsTrigger>
          <TabsTrigger value="visuals" disabled={!currentProjectId}>
            <BarChart3 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Visuals</span>
            <span className="sm:hidden">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="add-project">
            <FolderPlus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">Project</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Prefs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="flex-grow">
          <HomeTab />
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
        <TabsContent value="add-project" className="flex-grow">
          <AddProjectTab />
        </TabsContent>
        <TabsContent value="settings" className="flex-grow">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
