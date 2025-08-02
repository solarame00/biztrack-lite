
"use client";

import { useData } from "@/contexts/DataContext";
import { TrendsGraph } from "@/components/visuals/trends-graph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseCategoryChart } from "@/components/visuals/expense-category-chart";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface VisualsTabProps {
  onGoToDashboard: () => void;
}

export function VisualsTab({ onGoToDashboard }: VisualsTabProps) {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    return (
        <Card className="shadow-lg rounded-xl h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Financial Trends</CardTitle>
                <CardDescription>Select a project to visualize its financial trends.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-center text-muted-foreground py-8">Please select a project to view its visuals.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-start">
             <Button onClick={onGoToDashboard} variant="outline" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4"/>
                Go to Dashboard
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:-mt-12">
            <TrendsGraph />
            <ExpenseCategoryChart />
        </div>
    </div>
  );
}
