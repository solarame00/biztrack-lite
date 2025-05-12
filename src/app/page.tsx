
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth/auth-button" 
import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { AddExpenseForm } from "@/components/forms/add-expense-form"
import { AddCashForm } from "@/components/forms/add-cash-form"
import { FilterControls } from "@/components/dashboard/filter-controls"
import { HistoryView } from "@/components/dashboard/history-view"
import { CurrencySelector } from "@/components/settings/currency-selector"
import { TrendsGraph } from "@/components/visuals/trends-graph"
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { AddProjectForm } from "@/components/projects/add-project-form"
import { useData } from "@/contexts/DataContext";
import { Landmark, Receipt, DollarSignIcon, History, Settings, BarChart3, FolderPlus, AlertCircle, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { currentUser, currentProjectId, loading: dataContextLoading, projects } = useData();
  const router = useRouter();

  if (dataContextLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col"> {/* Ensure flex flex-col for robust stacking */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0 shrink-0"> {/* Added shrink-0 */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-xl sm:text-3xl font-bold text-primary">BizTrack Lite</h1>
          <ProjectSwitcher />
        </div>
        <div className="flex items-center space-x-2">
          <AuthButton /> 
          <ThemeToggle />
        </div>
      </header>

      {!currentProjectId && projects.length > 0 && (
         <Card className="shadow-lg rounded-xl mb-6 shrink-0"> {/* Added shrink-0 */}
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><AlertCircle className="mr-2 h-6 w-6 text-destructive" /> No Project Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Please select a project from the dropdown above to view its data, or create a new project.</p>
            </CardContent>
         </Card>
      )}

      {projects.length === 0 && (
           <Card className="shadow-lg rounded-xl mb-6 shrink-0"> {/* Added shrink-0 */}
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><FolderPlus className="mr-2 h-6 w-6 text-primary" /> Welcome, {currentUser.displayName || currentUser.email}!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">It looks like you don't have any projects yet. Create your first project to get started.</p>
                <AddProjectForm />
            </CardContent>
         </Card>
      )}


      <Tabs defaultValue="home" className="w-full flex-grow flex flex-col"> {/* Ensured Tabs can grow and also uses flex-col */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 mb-6 shrink-0"> {/* Adjusted grid-cols for responsiveness, added shrink-0 */}
          <TabsTrigger value="home" disabled={!currentProjectId}>
            <Landmark className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {/* Responsive icon margin/size */}
            <span className="hidden sm:inline">Home</span> {/* Hide text on very small screens */}
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

        <TabsContent value="home" className="flex-grow"> {/* Ensured TabsContent can grow */}
          {currentProjectId ? (
            <Card className="shadow-lg rounded-xl h-full flex flex-col"> {/* Ensured Card takes full height and is flex-col */}
              <CardHeader className="shrink-0">
                <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
                <CardDescription>Your financial snapshot for the current project. Apply filters to view specific periods or dates.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col"> {/* Ensured CardContent can grow and is flex-col */}
                <FilterControls />
                <div className="flex-grow mt-4"> {/* Wrapper for HomeDashboard to grow and add margin */}
                    <HomeDashboard />
                </div>
              </CardContent>
            </Card>
          ) : <p className="text-center text-muted-foreground py-8">Select or create a project to view its dashboard.</p>}
        </TabsContent>

        <TabsContent value="add-expense" className="flex-grow">
          {currentProjectId ? (
            <Card className="shadow-lg rounded-xl h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Log New Expense</CardTitle>
                <CardDescription>Keep track of your spending for the current project.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddExpenseForm />
              </CardContent>
            </Card>
          ) : <p className="text-center text-muted-foreground py-8">Select or create a project to add an expense.</p>}
        </TabsContent>

        <TabsContent value="add-cash" className="flex-grow">
          {currentProjectId ? (
            <Card className="shadow-lg rounded-xl h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Record Cash Transaction</CardTitle>
                <CardDescription>Log cash in for the current project.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddCashForm />
              </CardContent>
            </Card>
          ) : <p className="text-center text-muted-foreground py-8">Select or create a project to add cash.</p>}
        </TabsContent>

        <TabsContent value="history" className="flex-grow flex flex-col">
          {currentProjectId ? (
            <Card className="shadow-lg rounded-xl h-full flex flex-col">
              <CardHeader className="shrink-0">
                  <CardTitle className="text-2xl">Transaction History</CardTitle>
                  <CardDescription>Review your past cash and expense transactions for the current project.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                  <FilterControls />
                  <div className="flex-grow mt-4"> {/* Added margin */}
                    <HistoryView />
                  </div>
              </CardContent>
            </Card>
          ) : <p className="text-center text-muted-foreground py-8">Select or create a project to view its history.</p>}
        </TabsContent>

        <TabsContent value="visuals" className="flex-grow flex flex-col">
          {currentProjectId ? (
            <div className="h-full flex flex-col">
              <FilterControls />
              <div className="flex-grow mt-4"> {/* Added margin */}
                 <TrendsGraph />
              </div>
            </div>
          ) : <p className="text-center text-muted-foreground py-8">Select or create a project to view its visuals.</p>}
        </TabsContent>

        <TabsContent value="add-project" className="flex-grow">
            <Card className="shadow-lg rounded-xl h-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Project</CardTitle>
                    <CardDescription>Set up a new project to track its finances independently.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddProjectForm />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-grow">
          <CurrencySelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    