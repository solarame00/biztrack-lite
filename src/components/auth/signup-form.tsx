
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

// Google icon SVG
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        title: "Signup Failed",
        description: "Firebase authentication is not available. Please try again later or contact support if the issue persists.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Account Created",
        description: "Welcome! You're now logged in.",
        className: "bg-primary text-primary-foreground",
      });
      router.push("/");
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-email":
            description = "The email address is not valid.";
            break;
          case "auth/email-already-in-use":
            description = "This email address is already in use by another account.";
            break;
          case "auth/weak-password":
            description = "The password is too weak. Please choose a stronger password.";
            break;
          case "auth/invalid-api-key":
             description = "Firebase API Key is invalid. Please check configuration.";
             break;
          case "auth/operation-not-allowed":
             description = "Email/password sign-up is not enabled. Please check Firebase console (Authentication -> Sign-in method).";
             break;
          case "auth/configuration-not-found":
             description = "Firebase Authentication configuration error. Please ensure Email/Password sign-in is enabled in your Firebase project console.";
             break;
          default:
            description = error.message || "Could not create account. Please try again.";
        }
      } else if (error.message) {
        description = error.message;
      }
      console.error("Signup Form Error (Email/Password):", error.code, error.message); 
      toast({
        title: "Signup Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    if (!auth) {
      toast({
        title: "Google Sign-Up Failed",
        description: "Firebase authentication is not available. Please try again later or contact support if the issue persists.",
        variant: "destructive",
      });
      return;
    }
    const provider = new GoogleAuthProvider();
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed Up with Google",
        description: "Welcome!",
        className: "bg-primary text-primary-foreground",
      });
      router.push("/");
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            description = "Google Sign-Up was closed before completion.";
            break;
          case "auth/cancelled-popup-request":
            description = "Multiple Google Sign-Up popups were opened. Please try again.";
            break;
          case "auth/operation-not-allowed":
            description = "Google Sign-Up is not enabled for this app. Please check Firebase console (Authentication -> Sign-in method).";
            break;
           case "auth/invalid-api-key":
             description = "Firebase API Key is invalid for Google Sign-Up. Please check configuration.";
             break;
           case "auth/configuration-not-found":
             description = "Firebase Authentication configuration error for Google Sign-In. Please ensure Google sign-in is enabled in your Firebase project console.";
             break;
          default:
            description = error.message || "Could not sign up with Google. Please try again.";
        }
      } else if (error.message) {
        description = error.message;
      }
      console.error("Signup Form Error (Google Sign-In):", error.code, error.message); 
      toast({
        title: "Google Sign-Up Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
           {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
         <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="w-full" disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {isGoogleLoading ? "Signing up..." : "Google"}
        </Button>
      </form>
    </Form>
  );
}
