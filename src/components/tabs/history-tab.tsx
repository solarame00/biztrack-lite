
"use client";

import { useData } from "@/contexts/DataContext";
import { HistoryView } from "@/components/dashboard/history-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function HistoryTab() {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Transaction History</CardTitle>
                <CardDescription>Select a project to review its past transactions.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-center text-muted-foreground py-8">Please select a project to view its history.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
      <HistoryView />
    </div>
  );
}
