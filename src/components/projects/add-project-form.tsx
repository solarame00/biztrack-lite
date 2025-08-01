
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  projectType: z.enum(["personal", "business"], {
    required_error: "You need to select a project type.",
  }),
});

export function AddProjectForm() {
  const { toast } = useToast();
  const { addProject, setCurrentProjectId, currentUser } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      projectType: "personal",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a project.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newProjectId = await addProject({
        name: values.name,
        description: values.description,
        projectType: values.projectType,
      });

      if (newProjectId) {
        setCurrentProjectId(newProjectId); 
        toast({
          title: "Project Created",
          description: `Project "${values.name}" has been successfully created and selected.`,
          className: "bg-primary text-primary-foreground",
        });
        form.reset();
      } else {
        toast({
          title: "Project Creation Failed",
          description: "Could not create the project. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating project in form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Online Store, SaaS App Q3" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Enter a unique and descriptive name for your project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Project Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                  disabled={isSubmitting}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="personal" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Personal
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="business" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Business
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the type of project to tailor your dashboard metrics.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any relevant details about this project..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional: Provide a brief description for this project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={!currentUser || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FolderPlus className="mr-2 h-5 w-5" />
          )}
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
      </form>
    </Form>
  );
}

    
