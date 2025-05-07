// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;

if (typeof window !== 'undefined') { // Ensure this only runs on the client
  const missingKeys = Object.entries(firebaseConfig)
    // Filter out keys whose values are undefined or an empty string
    .filter(([key, value]) => typeof value === 'undefined' || value === '')
    .map(([key]) => {
        // Map back to the original NEXT_PUBLIC_ name for clarity in the error message
        if (key === "apiKey") return "NEXT_PUBLIC_FIREBASE_API_KEY";
        if (key === "authDomain") return "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN";
        if (key === "projectId") return "NEXT_PUBLIC_FIREBASE_PROJECT_ID";
        if (key === "storageBucket") return "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET";
        if (key === "messagingSenderId") return "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID";
        if (key === "appId") return "NEXT_PUBLIC_FIREBASE_APP_ID";
        return key; // Should ideally not happen if firebaseConfig keys are static
    });

  if (missingKeys.length > 0) {
    console.error(
      `Firebase Initialization Failed: The following Firebase environment variables are missing or empty: ${missingKeys.join(', ')}. ` +
      "These variables are expected to be available during the Vercel build process. " +
      "Please ensure they are correctly set in your .env.local file (for local development) or in your Vercel project's Environment Variable settings (for Production/Preview deployments). " +
      "Verify they are available to the Build Step and for the correct Vercel environment. " +
      "Firebase initialization will be skipped. Double-check names for typos (e.g., ensure 'NEXT_PUBLIC_FIREBASE_...') and values for accidental spaces."
    );
    // app and auth will remain undefined
  } else {
    // All keys are present
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
      // Only attempt to getAuth if app was successfully initialized
      if (app) {
        auth = getAuth(app);
      } else {
        // This case should ideally not be reached if missingKeys.length was 0 and initializeApp didn't throw
        console.error("Firebase app object is undefined after initialization attempt, though all keys were reportedly present. Cannot get Auth instance.");
      }
    } catch (error: any) {
      console.error("An error occurred during Firebase initialization (initializeApp or getAuth call):", error);
      if (error && typeof error === 'object' && 'code' in error && typeof (error as {code: string}).code === 'string') {
            const errorCode = (error as {code: string}).code;
            console.error("Firebase Error Code:", errorCode);
            if (errorCode === 'auth/invalid-api-key' || errorCode.includes("invalid-api-key")) { // More robust check for invalid api key
                 console.error("Specific Firebase Auth Error: The API key (NEXT_PUBLIC_FIREBASE_API_KEY) is invalid. Please verify the key's value in your Firebase console and Vercel environment variables.");
            }
        }
      app = undefined; // Ensure app is undefined if initialization fails
      auth = undefined; // Ensure auth is undefined if initialization fails
    }
  }
} else {
  // On the server, app and auth will remain undefined.
  // This is expected for a client-side focused Firebase setup.
}

export { app, auth };
