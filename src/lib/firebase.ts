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
  const essentialKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingEssentialKeys = essentialKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missingEssentialKeys.length > 0) {
    console.error(
      `Firebase Initialization Failed: The following Firebase configuration values are missing or empty in the hardcoded config: ${missingEssentialKeys.join(', ')}. ` +
      "Please verify the hardcoded values in src/lib/firebase.ts. " +
      "Firebase initialization will be skipped."
    );
  } else {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }

      if (app) {
        try {
          auth = getAuth(app);
        } catch (authError: any) {
          console.error("Firebase getAuth() failed:", authError);
          if (authError.code === 'auth/configuration-not-found') {
            console.error(
              "Firebase Auth Error (auth/configuration-not-found) during getAuth(): " +
              "This usually means that the Authentication service is not properly enabled or configured for your Firebase project in the Firebase Console. " +
              "Please go to your Firebase project settings -> Authentication -> Sign-in method, and ensure the desired providers (e.g., Email/Password) are enabled."
            );
          }
          // auth will remain undefined
        }
      } else {
        console.error("Firebase app object is undefined after initialization attempt. Cannot get Auth instance.");
        // auth will remain undefined
      }
    } catch (initError: any) {
      console.error("An error occurred during Firebase app initialization (initializeApp or getApp call):", initError);
      if (initError.code === 'auth/invalid-api-key') {
        console.error("Specific Firebase Error: The API key in firebaseConfig is invalid. Please verify its value.");
      }
      // app and auth will remain undefined
    }
  }
}

export { app, auth };
