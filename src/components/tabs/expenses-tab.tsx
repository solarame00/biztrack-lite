
"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { HistoryView } from "@/components/dashboard/history-view";
import { Button } from "@/components/ui/button";
import { PlusCircle, List } from "lucide-react";
import { LiveProjectSummary } from "../dashboard/live-project-summary";

type ExpensesView = "list" | "add";

export function ExpensesTab() {
  const { currentProjectId, setFilter } = useData();
  const [view, setView] = useState<ExpensesView>("list");

  const handleShowList = () => {
    // Ensure the filter is set to show only expenses when viewing history here
    setFilter({ type: "transactionType", transactionType: "expense" });
    setView("list");
  };
  
  const handleShowAddForm = () => {
    setView("add");
  }
  
  // Set the filter correctly when the component mounts
  useState(() => {
    handleShowList();
  });


  if (!currentProjectId) {
    return (
      <Card className="shadow-lg rounded-xl h-full">
        <CardHeader>
          <CardTitle className="text-2xl">Expenses</CardTitle>
          <CardDescription>Select a project to manage its expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Please select a project to view or add expenses.</p>
        </CardContent>
      </Card>
    );
  }
  
  // When an expense is added, we want to go back to the list view.
  const onExpenseAdded = () => {
    handleShowList();
  };

  const AddExpenseView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="shadow-lg rounded-xl transition-all hover:shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Log New Expense</CardTitle>
                <CardDescription>Keep track of your spending for the current project.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddExpenseForm onExpenseAdded={onExpenseAdded} />
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
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleShowList} variant={view === 'list' ? 'default' : 'outline'} size="sm">
            <List className="mr-2 h-4 w-4"/>
            View Expenses
        </Button>
        <Button onClick={handleShowAddForm} variant={view === 'add' ? 'default' : 'outline'} size="sm">
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add Expense
        </Button>
      </div>

      {view === 'list' ? <HistoryView /> : <AddExpenseView />}
    </div>
  );
}
