
"use client";

import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Briefcase } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { currentUser, loading: dataContextLoading } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!dataContextLoading && currentUser) {
      router.push("/"); // Redirect to home if already logged in
    }
  }, [currentUser, dataContextLoading, router]);

  // Show loading spinner if data context is loading OR if user is logged in and redirecting
  if (dataContextLoading || (!dataContextLoading && currentUser)) {
     return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If not loading and no user, show login/signup form
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
       <div className="flex items-center justify-center p-4 sm:p-8 md:p-12">
        <Card className="mx-auto w-full max-w-md shadow-xl border">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
                    <Briefcase className="h-8 w-8 text-primary-foreground"/>
                </div>
              <CardTitle className="text-3xl font-bold text-primary">Welcome to BizTrack Lite</CardTitle>
              <CardDescription>The simplest way to track your project finances. Sign in with Google to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleSignInButton />
            </CardContent>
        </Card>
      </div>
       <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-10 text-center relative">
         <div className="absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary">
            <Briefcase className="h-6 w-6"/>
            <span>BizTrack Lite</span>
         </div>
         <div className="w-full max-w-md">
            <Image
                src="https://placehold.co/600x400.png"
                alt="A placeholder image illustrating a financial dashboard with charts and graphs"
                data-ai-hint="financial dashboard illustration"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
             />
         </div>
        <div className="mt-8">
            <h2 className="text-3xl font-bold tracking-tight">Your Financial Co-Pilot</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Track expenses, manage cash flow, and see your financial picture with clarity.</p>
        </div>
      </div>
    </div>
  );
}
