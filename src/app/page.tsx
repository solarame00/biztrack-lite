
"use client";
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import type { Transaction } from "@/types";
import { Landmark, Receipt, DollarSignIcon, History, Settings, BarChart3, FolderPlus, AlertCircle, LogIn, Loader2, Briefcase, Bot, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth/auth-button" 
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { AddProjectForm } from "@/components/projects/add-project-form"

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
  SidebarMenuBadge,
  SidebarTrigger,
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"


// Import tab content components
import { HomeTab } from "@/components/tabs/home-tab";
import { AddExpenseTab } from "@/components/tabs/add-expense-tab";
import { AddCashTab } from "@/components/tabs/add-cash-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { VisualsTab } from "@/components/tabs/visuals-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { AiAssistantTab } from "@/components/tabs/ai-assistant-tab";

type View = "home" | "ai-assistant" | "add-expense" | "add-cash" | "history" | "visuals" | "settings";

function AppContent() {
  const { currentUser, currentProjectId, loading: dataContextLoading, projects, setFilter } = useData();
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>("home");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isMobile } = useSidebar();


  if (dataContextLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading BizTrack...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">BizTrack</CardTitle>
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
    setIsSheetOpen(false); 
    setActiveView("home");   
  };
  
  const handleDrillDown = (transactionType: Transaction['type']) => {
    setFilter({ type: "transactionType", transactionType });
    setActiveView("history");
  };

  const renderContent = () => {
    switch (activeView) {
      case "home": return <HomeTab onDrillDown={handleDrillDown}/>;
      case "ai-assistant": return <AiAssistantTab />;
      case "add-expense": return <AddExpenseTab />;
      case "add-cash": return <AddCashTab />;
      case "history": return <HistoryTab />;
      case "visuals": return <VisualsTab />;
      case "settings": return <SettingsTab />;
      default: return <HomeTab onDrillDown={handleDrillDown}/>;
    }
  }

  const isNavItemDisabled = !currentProjectId;

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
                <SheetHeader>
                  <SheetTitle>Create a New Project</SheetTitle>
                  <SheetDescription>
                    Set up a new project to track its finances independently.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                    <div className="py-4 pr-6">
                        <AddProjectForm onProjectCreated={handleProjectCreated} />
                    </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("home")} isActive={activeView === 'home'} disabled={isNavItemDisabled}>
                    <Landmark />
                    Home
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("ai-assistant")} isActive={activeView === 'ai-assistant'} disabled={isNavItemDisabled}>
                    <Bot />
                    AI Assistant
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("add-expense")} isActive={activeView === 'add-expense'} disabled={isNavItemDisabled}>
                    <Receipt />
                    Add Expense
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("add-cash")} isActive={activeView === 'add-cash'} disabled={isNavItemDisabled}>
                    <DollarSignIcon />
                    Add Cash
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("history")} isActive={activeView === 'history'} disabled={isNavItemDisabled}>
                    <History />
                    History
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView("visuals")} isActive={activeView === 'visuals'} disabled={isNavItemDisabled}>
                    <BarChart3 />
                    Visuals
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           {/* Can add breadcrumbs or page titles here in the future */}
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
                    <CardTitle className="text-2xl flex items-center justify-center"><FolderPlus className="mr-2 h-6 w-6 text-primary" /> Welcome, {currentUser.displayName || currentUser.email}!</CardTitle>
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

            {renderContent()}
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
