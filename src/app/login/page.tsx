
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

  if (dataContextLoading || (!dataContextLoading && currentUser)) {
     return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
       <div className="flex items-center justify-center p-4 sm:p-8 md:p-12">
        <Card className="mx-auto w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-2xl">
            <CardHeader className="text-center space-y-4 pt-8">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2 border border-primary/20">
                    <Briefcase className="h-8 w-8 text-primary"/>
                </div>
              <CardTitle className="text-3xl font-bold tracking-tighter text-primary">Welcome to BizTrack</CardTitle>
              <CardDescription className="text-muted-foreground !mt-2">
                The simplest way to track your project finances.
                <br />
                Sign in with Google to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <GoogleSignInButton />
            </CardContent>
        </Card>
      </div>
       <div className="hidden bg-muted md:flex flex-col items-center justify-center p-10 text-center relative">
         <div className="absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold text-primary">
            <Briefcase className="h-6 w-6"/>
            <span>BizTrack</span>
         </div>
         <div className="w-full max-w-md">
            <Image
                src="https://placehold.co/600x400.png"
                alt="A placeholder image illustrating a financial dashboard with charts and graphs"
                data-ai-hint="financial dashboard"
                width={600}
                height={400}
                className="rounded-xl shadow-2xl"
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
