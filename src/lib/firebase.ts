// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// User-provided Firebase configuration values
const firebaseConfig = {
  apiKey: "AIzaSyAiNpd5nz8ii7KBxM-Dv2VafgYTcCicVAM",
  authDomain: "biztrack-lite-54a6a.firebaseapp.com",
  projectId: "biztrack-lite-54a6a",
  storageBucket: "biztrack-lite-54a6a.firebasestorage.app",
  messagingSenderId: "114163639849",
  appId: "1:114163639849:web:4282a77421e4f1d2765e38",
  measurementId: "G-SBCJ9K5F8R" // Added measurementId as provided
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;

if (typeof window !== 'undefined') { // Ensure this only runs on the client
  // Check if any essential Firebase config values are missing (after hardcoding)
  // This check might seem redundant now but is good practice if config structure changes
  const essentialKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingEssentialKeys = essentialKeys.filter(key => !firebaseConfig[key]);

  if (missingEssentialKeys.length > 0) {
    console.error(
      `Firebase Initialization Failed: The following Firebase configuration values are missing or empty in the hardcoded config: ${missingEssentialKeys.join(', ')}. ` +
      "Please verify the hardcoded values in src/lib/firebase.ts. " +
      "Firebase initialization will be skipped."
    );
    // app and auth will remain undefined
  } else {
    // All essential keys are present in the hardcoded config
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
        console.error("Firebase app object is undefined after initialization attempt, even with hardcoded config. Cannot get Auth instance.");
      }
    } catch (error: any) {
      console.error("An error occurred during Firebase initialization (initializeApp or getAuth call) with hardcoded config:", error);
      if (error && typeof error === 'object' && 'code' in error && typeof (error as {code: string}).code === 'string') {
            const errorCode = (error as {code: string}).code;
            console.error("Firebase Error Code:", errorCode);
            if (errorCode === 'auth/invalid-api-key' || errorCode.includes("invalid-api-key")) {
                 console.error("Specific Firebase Auth Error: The API key provided in the hardcoded config is invalid. Please verify the key's value.");
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

