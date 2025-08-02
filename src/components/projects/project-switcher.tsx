
"use client";

import { useData } from "@/contexts/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FolderKanban, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export function ProjectSwitcher() {
  const { projects, currentProjectId, setCurrentProjectId, loading, deleteProject, currentUser } = useData();
  const { toast } = useToast();

  if (loading && !currentUser) {
    return (
        <div className="flex items-center space-x-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
                Loading...
            </span>
        </div>
    );
  }

   if (!currentUser) { 
     return null;
   }
   
   if (projects.length === 0 && !loading) {
    return null; // Don't show anything if there are no projects, the main page will show the welcome banner
  }


  const handleProjectChange = (projectId: string) => {
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  };

  const handleDeleteProject = () => {
    if (currentProjectId) {
      deleteProject(currentProjectId);
    } else {
        toast({
            title: "Error",
            description: "No project selected to delete.",
            variant: "destructive",
        });
    }
  };

  const currentProjectDetails = projects.find(p => p.id === currentProjectId);
  const currentProjectName = currentProjectDetails?.name || "Selected Project";


  return (
    <div className="flex w-full items-center space-x-2">
      <Select
        value={currentProjectId || ""}
        onValueChange={handleProjectChange}
        disabled={projects.length === 0}
      >
        <SelectTrigger className="w-full text-sm">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <SelectValue placeholder="Select a project" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentProjectId && projects.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 shrink-0">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Project {currentProjectName}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project: "{currentProjectName}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project and all its associated data (transactions, history)? This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
