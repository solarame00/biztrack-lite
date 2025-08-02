
"use client";

import { useData } from "@/contexts/DataContext";
import { TrendsGraph } from "@/components/visuals/trends-graph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="h-full flex flex-col -mt-12">
      <div className="flex-grow">
        <TrendsGraph />
      </div>
    </div>
  );
}
