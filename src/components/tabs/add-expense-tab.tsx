
"use client";

import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { LiveProjectSummary } from "@/components/dashboard/live-project-summary";

export function AddExpenseTab() {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Log New Expense</CardTitle>
                <CardDescription>Select or create a project to log expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">Please select a project to add an expense.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
       <div className="md:col-span-2">
            <Card className="shadow-lg rounded-xl h-full transition-all hover:shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Log New Expense</CardTitle>
                    <CardDescription>Keep track of your spending for the current project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddExpenseForm />
                </CardContent>
            </Card>
        </div>
        <aside className="md:col-span-1">
            <LiveProjectSummary />
        </aside>
    </div>
  );
}
