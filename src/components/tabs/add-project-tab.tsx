
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProjectForm } from "@/components/projects/add-project-form";

export function AddProjectTab() {
  return (
    <Card className="shadow-lg rounded-xl h-full">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Project</CardTitle>
        <CardDescription>Set up a new project to track its finances independently.</CardDescription>
      </CardHeader>
      <CardContent>
        <AddProjectForm />
      </CardContent>
    </Card>
  );
}
