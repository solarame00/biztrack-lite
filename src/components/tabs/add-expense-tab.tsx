
"use client";

import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExpenseForm } from "@/components/forms/add-expense-form";

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
    <Card className="shadow-lg rounded-xl h-full transition-all hover:shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Log New Expense</CardTitle>
        <CardDescription>Keep track of your spending for the current project.</CardDescription>
      </CardHeader>
      <CardContent>
        <AddExpenseForm />
      </CardContent>
    </Card>
  );
}
