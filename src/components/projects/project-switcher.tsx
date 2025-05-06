
"use client";

import { useData } from "@/contexts/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderKanban } from "lucide-react";

export function ProjectSwitcher() {
  const { projects, currentProjectId, setCurrentProjectId, loading } = useData();

  if (loading || projects.length === 0) {
    return (
        <div className="flex items-center space-x-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
                {loading ? "Loading projects..." : projects.length === 0 ? "No projects" : "Select Project"}
            </span>
        </div>
    );
  }

  const handleProjectChange = (projectId: string) => {
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <FolderKanban className="h-5 w-5 text-primary" />
      <Select
        value={currentProjectId || ""}
        onValueChange={handleProjectChange}
        disabled={projects.length === 0}
      >
        <SelectTrigger className="w-[200px] sm:w-[250px] md:w-[300px] text-sm">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
