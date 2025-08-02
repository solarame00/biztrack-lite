
"use client";

import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCashForm } from "@/components/forms/add-cash-form";
import { HistoryView } from "@/components/dashboard/history-view";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, LayoutDashboard } from "lucide-react";
import { LiveProjectSummary } from "../dashboard/live-project-summary";

type RevenueView = "list" | "add";

interface RevenueTabProps {
  onGoToDashboard: () => void;
}

export function RevenueTab({ onGoToDashboard }: RevenueTabProps) {
  const { currentProjectId, setFilter } = useData();
  const [view, setView] = useState<RevenueView>("list");

  const handleShowList = () => {
    // Ensure the filter is set to show only cash-in when viewing history here
    setFilter({ type: "transactionType", transactionType: "cash-in" });
    setView("list");
  };
  
  const handleShowAddForm = () => {
    setView("add");
  }
  
  // Set the filter correctly when the component mounts and when view changes back to 'list'
  useEffect(() => {
    if (view === 'list') {
      setFilter({ type: "transactionType", transactionType: "cash-in" });
    }
  }, [view, setFilter]);

  if (!currentProjectId) {
    return (
      <Card className="shadow-lg rounded-xl h-full">
        <CardHeader>
          <CardTitle className="text-2xl">Revenue</CardTitle>
          <CardDescription>Select a project to manage its revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Please select a project to view or add revenue.</p>
        </CardContent>
      </Card>
    );
  }
  
  // When cash is added, we want to go back to the list view.
  const onCashAdded = () => {
    handleShowList();
  };

  const AddRevenueView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 order-2 lg:order-1">
        <Card className="shadow-lg rounded-xl transition-all hover:shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Record Revenue / Cash In</CardTitle>
              <CardDescription>Log cash income for the current project.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddCashForm onCashAdded={onCashAdded} />
            </CardContent>
        </Card>
      </div>
      <div className="order-1 lg:order-2">
        <LiveProjectSummary />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={onGoToDashboard} variant="outline" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4"/>
            Go to Dashboard
        </Button>
        <div className="flex items-center justify-end gap-2">
          <Button onClick={handleShowList} variant={view === 'list' ? 'default' : 'outline'} size="sm">
              <List className="mr-2 h-4 w-4"/>
              View Revenue
          </Button>
          <Button onClick={handleShowAddForm} variant={view === 'add' ? 'default' : 'outline'} size="sm">
              <PlusCircle className="mr-2 h-4 w-4"/>
              Add Revenue
          </Button>
        </div>
      </div>

      {view === 'list' ? <HistoryView /> : <AddRevenueView />}
    </div>
  );
}
