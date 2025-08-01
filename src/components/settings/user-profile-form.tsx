
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { User, Mail, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const formSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  email: z.string().email(),
});

export function UserProfileForm() {
  const { currentUser, updateUserProfile } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
      });
    }
  }, [currentUser, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await updateUserProfile({ displayName: values.displayName });
    } catch (error) {
      // Error toast is handled in DataContext
      console.error("Profile update failed in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">User Profile</CardTitle>
          </div>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
             <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">User Profile</CardTitle>
        </div>
        <CardDescription>Manage your account details here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Your email address cannot be changed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
