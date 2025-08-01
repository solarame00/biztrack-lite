
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; 
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


export function GoogleSignInButton() {
  const { toast } = useToast();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    if (!auth) {
      toast({
        title: "Google Sign-In Failed",
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
        title: "Logged In with Google",
        description: "Welcome!",
        className: "bg-primary text-primary-foreground",
      });
      router.push("/");
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            description = "Google Sign-In was closed before completion.";
            break;
          case "auth/cancelled-popup-request":
            description = "Multiple Google Sign-In popups were opened. Please try again.";
            break;
          case "auth/operation-not-allowed":
            description = "Google Sign-In is not enabled for this app. Please check Firebase console (Authentication -> Sign-in method).";
            break;
          case "auth/invalid-api-key":
             description = "Firebase API Key is invalid for Google Sign-In. Please check configuration.";
             break;
          case "auth/configuration-not-found":
             description = "Firebase Authentication configuration error for Google Sign-In. Please ensure Google sign-in is enabled in your Firebase project console.";
             break;
          default:
            description = error.message || "Could not sign in with Google. Please try again.";
        }
      } else if (error.message) {
        description = error.message;
      }
      console.error("Login Form Error (Google Sign-In):", error.code, error.message); 
      toast({
        title: "Google Sign-In Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="mt-6">
        <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="w-full" disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {isGoogleLoading ? "Signing in..." : "Continue with Google"}
        </Button>
    </div>
  );
}
