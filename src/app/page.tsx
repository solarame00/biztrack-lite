

"use client";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { Landmark, Receipt, DollarSignIcon, History, Settings, BarChart3, FolderPlus, AlertCircle, LogIn, Loader2, Briefcase, Bot, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth/auth-button" 
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { AddProjectForm } from "@/components/forms/add-project-form"
import { FilterControls } from "@/components/dashboard/filter-controls"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"


// Import tab content components
import { DashboardTab } from "@/components/tabs/dashboard-tab";
import { ExpensesTab } from "@/components/tabs/expenses-tab";
import { RevenueTab } from "@/components/tabs/revenue-tab";
import { VisualsTab } from "@/components/tabs/visuals-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { AiAssistantTab } from "@/components/tabs/ai-assistant-tab";

type View = "dashboard" | "revenue" | "expenses" | "ai-assistant" | "visuals" | "settings";

const viewDetails: Record<View, { title: string; showFilters: boolean }> = {
  dashboard: { title: "Dashboard Overview", showFilters: true },
  revenue: { title: "Revenue", showFilters: false },
  expenses: { title: "Expenses", showFilters: false },
  "ai-assistant": { title: "AI Financial Assistant", showFilters: false },
  visuals: { title: "Financial Trends", showFilters: true },
  settings: { title: "Application Settings", showFilters: false },
};

function AppContent() {
  const { currentUser, currentProjectId, loading: dataContextLoading, projects, setFilter, currentProject } = useData();
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isMobile } = useSidebar();


  useEffect(() => {
    if (!dataContextLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, dataContextLoading, router]);
  
  // When project changes, if current view is not supported, switch to dashboard
  useEffect(() => {
      if (currentProject) {
          const pref = currentProject.trackingPreference;
          if (pref === 'expensesOnly' && activeView === 'revenue') {
              setActiveView('dashboard');
          }
          if (pref === 'revenueOnly' && activeView === 'expenses') {
              setActiveView('dashboard');
          }
      }
  }, [currentProject, activeView]);

  if (dataContextLoading || (!dataContextLoading && !currentUser)) {
     return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  const handleProjectCreated = () => {
    setIsSheetOpen(false); 
    setActiveView("dashboard");   
  };
  
  const handleDrillDown = (transactionType: 'expense' | 'cash-in') => {
    // This function is called from the dashboard cards to navigate to the relevant tab
    if (transactionType === 'expense') {
        setActiveView('expenses');
    } else if (transactionType === 'cash-in') {
        setActiveView('revenue');
    }
  };
  
  const goToDashboard = () => setActiveView("dashboard");


  const renderContent = () => {
    switch (activeView) {
      case "dashboard": return <DashboardTab onDrillDown={handleDrillDown}/>;
      case "revenue": return <RevenueTab onGoToDashboard={goToDashboard} />;
      case "expenses": return <ExpensesTab onGoToDashboard={goToDashboard} />;
      case "ai-assistant": return <AiAssistantTab />;
      case "visuals": return <VisualsTab onGoToDashboard={goToDashboard} />;
      case "settings": return <SettingsTab onGoToDashboard={goToDashboard}/>;
      default: return <DashboardTab onDrillDown={handleDrillDown}/>;
    }
  }

  const isNavItemDisabled = !currentProjectId;
  const currentViewDetails = viewDetails[activeView];
  
  const trackingPreference = currentProject?.trackingPreference || 'revenueAndExpenses';
  const showRevenueTab = trackingPreference === 'revenueAndExpenses' || trackingPreference === 'revenueOnly';
  const showExpensesTab = trackingPreference === 'revenueAndExpenses' || trackingPreference === 'expensesOnly';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <Sidebar>
          <SidebarHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">BizTrack</h1>
              </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <div className="mb-2">
              <ProjectSwitcher />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                 <Button className="w-full justify-start">
                  <FolderPlus className="mr-2 h-5 w-5" />
                  New Project
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col" side="right">
                <SheetHeader className="p-6">
                  <SheetTitle>Create a New Project</SheetTitle>
                  <SheetDescription>
                    Set up a new project to track its finances independently.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-6">
                        <AddProjectForm onProjectCreated={handleProjectCreated} />
                    </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("dashboard")} isActive={activeView === 'dashboard'} disabled={isNavItemDisabled}>
                    <LayoutDashboard />
                    Dashboard
                  </SidebarMenuButton>
              </SidebarMenuItem>
              {showRevenueTab && (
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView("revenue")} isActive={activeView === 'revenue'} disabled={isNavItemDisabled}>
                      <DollarSignIcon />
                      Revenue
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {showExpensesTab && (
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView("expenses")} isActive={activeView === 'expenses'} disabled={isNavItemDisabled}>
                      <Receipt />
                      Expenses
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("visuals")} isActive={activeView === 'visuals'} disabled={isNavItemDisabled}>
                    <BarChart3 />
                    Visuals
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("ai-assistant")} isActive={activeView === 'ai-assistant'} disabled={isNavItemDisabled}>
                    <Bot />
                    AI Assistant
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("settings")} isActive={activeView === 'settings'}>
                    <Settings />
                    Settings
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-2">
            <div className="flex items-center gap-2">
              <AuthButton />
              <ThemeToggle />
            </div>
          </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <h2 className="font-semibold text-lg md:text-xl text-foreground/80">{currentViewDetails.title}</h2>
           {/* Header actions can go here in the future */}
        </header>

        <main className="flex-grow p-4 md:p-6 space-y-6">
            {!currentProjectId && projects.length > 0 && (
              <Card className="shadow-lg rounded-xl mb-6 shrink-0 border-destructive bg-destructive/10">
                  <CardHeader>
                      <CardTitle className="text-2xl flex items-center text-destructive"><AlertCircle className="mr-2 h-6 w-6" /> No Project Selected</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-destructive/90">Please select a project from the sidebar to view its data, or create a new project.</p>
                  </CardContent>
              </Card>
            )}
            {projects.length === 0 && (
                <Card className="shadow-lg rounded-xl mb-6 shrink-0 bg-primary/5 border-primary/20 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-center"><FolderPlus className="mr-2 h-6 w-6 text-primary" /> Welcome, {currentUser && (currentUser.displayName || currentUser.email)}!</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        It looks like you don't have any projects yet. Create your first project to start tracking your finances.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsSheetOpen(true)} size="lg">
                        <FolderPlus className="mr-2 h-5 w-5" />
                        Create Your First Project
                    </Button>
                </CardContent>
            </Card>
            )}

            {currentProjectId && currentViewDetails.showFilters && (
              <FilterControls />
            )}

            {currentProjectId && renderContent()}
        </main>
      </SidebarInset>
    </div>
  );
}

export default function HomePage() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  )
}
