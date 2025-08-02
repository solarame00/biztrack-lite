
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
    <div className="flex-grow flex flex-col -mt-12">
        <HomeDashboard onDrillDown={onDrillDown} />
    </div>
  );
}
