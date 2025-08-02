
"use client";

import { useData } from "@/contexts/DataContext";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/types";

interface HomeTabProps {
  onDrillDown: (transactionType: Transaction['type']) => void;
}

export function HomeTab({ onDrillDown }: HomeTabProps) {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
                <CardDescription>Select a project to see its financial snapshot.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-center text-muted-foreground py-8">Please select or create a project to view its dashboard.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl h-full flex flex-col transition-all hover:shadow-xl">
      <CardHeader className="shrink-0">
        <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
        <CardDescription>Your financial snapshot for the current project. Apply filters to view specific periods or dates.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex-grow">
          <HomeDashboard onDrillDown={onDrillDown} />
        </div>
      </CardContent>
    </Card>
  );
}
