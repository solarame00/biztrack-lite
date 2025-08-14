
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Loader2 } from "lucide-react";
import type { TrackingPreference } from "@/types";

const formSchema = z.object({
  projectType: z.enum(["personal", "business"]),
  trackingPreference: z.enum(["revenueAndExpenses", "expensesOnly", "revenueOnly"]),
});

export function ProjectSettingsForm() {
  const { currentProject, updateProjectSettings } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: "personal",
      trackingPreference: "revenueAndExpenses",
    },
  });
  
  useEffect(() => {
    if (currentProject) {
      form.reset({
        projectType: currentProject.projectType,
        trackingPreference: currentProject.trackingPreference,
      });
    }
  }, [currentProject, form]);


  const handleSettingChange = async (changedValues: Partial<z.infer<typeof formSchema>>) => {
     if (!currentProject) return;
     setIsSubmitting(true);
     try {
       await updateProjectSettings(currentProject.id, changedValues);
     } catch (e) {
        // Error toast is handled in DataContext
     } finally {
        setIsSubmitting(false);
     }
  };

  if (!currentProject) {
    return (
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Project Settings</CardTitle>
            </div>
            <CardDescription>Select a project to see its settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No project selected.</p>
          </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Project Settings</CardTitle>
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
        <CardDescription>
          Customize settings for the project <span className="font-semibold text-primary">{currentProject.name}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Project Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSettingChange({ projectType: value as "personal" | "business" });
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isSubmitting}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="personal" />
                        </FormControl>
                        <FormLabel className="font-normal">Personal</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="business" />
                        </FormControl>
                        <FormLabel className="font-normal">Business</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingPreference"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What to Track</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                         field.onChange(value);
                         handleSettingChange({ trackingPreference: value as TrackingPreference });
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isSubmitting}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="revenueAndExpenses" />
                        </FormControl>
                        <FormLabel className="font-normal">Revenue & Expenses</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expensesOnly" />
                        </FormControl>
                        <FormLabel className="font-normal">Expenses Only</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="revenueOnly" />
                        </FormControl>
                        <FormLabel className="font-normal">Revenue Only</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    