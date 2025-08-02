
"use client";

import { useData } from "@/contexts/DataContext";
import { TrendsGraph } from "@/components/visuals/trends-graph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseCategoryChart } from "@/components/visuals/expense-category-chart";

export function VisualsTab() {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 -mt-12">
        <TrendsGraph />
        <ExpenseCategoryChart />
    </div>
  );
}
