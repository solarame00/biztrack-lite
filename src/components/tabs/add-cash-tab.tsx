
"use client";

import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCashForm } from "@/components/forms/add-cash-form";
import { LiveProjectSummary } from "@/components/dashboard/live-project-summary";

export function AddCashTab() {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Record Cash Transaction</CardTitle>
                <CardDescription>Select or create a project to log cash inflows.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">Please select a project to add a cash transaction.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
        <div className="md:col-span-2">
            <Card className="shadow-lg rounded-xl h-full transition-all hover:shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Record Cash Transaction</CardTitle>
                    <CardDescription>Log cash in for the current project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddCashForm />
                </CardContent>
            </Card>
        </div>
        <aside className="md:col-span-1">
            <LiveProjectSummary />
        </aside>
    </div>
  );
}
