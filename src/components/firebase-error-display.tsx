
"use client";
import { useData } from "@/contexts/DataContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react"; // Ensure AlertCircle is imported

export function FirebaseErrorDisplay() {
  const { firebaseInitError } = useData();

  if (!firebaseInitError) {
    return null;
  }

  return (
    <div className="p-4 w-full fixed top-0 left-0 z-50 bg-background">
      <Alert variant="destructive" className="shadow-lg rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">Firebase Initialization Error</AlertTitle>
        <AlertDescription>
          {firebaseInitError}
          <p className="mt-1 text-xs">
            This means the app cannot connect to its database and authentication services.
            Please check your browser's developer console for more technical details.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}