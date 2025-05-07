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
  if (!firebaseConfig.apiKey) {
    console.error(
      "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. " +
      "Please ensure it is set in your .env.local file for local development, " +
      "or in your hosting provider's environment variables for production. " +
      "Firebase initialization will be skipped."
    );
  } else {
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
        console.error("Firebase app initialization failed. Cannot get Auth instance.");
      }
    } catch (error) {
      console.error("An error occurred during Firebase initialization:", error);
      // The specific FirebaseError (auth/invalid-api-key) usually means
      // the key was provided but was not valid for the project's auth service.
      // Other errors could be network issues, config errors, etc.
      app = undefined; // Ensure app is undefined if initialization fails
      auth = undefined; // Ensure auth is undefined if initialization fails
    }
  }
} else {
  // On the server, app and auth will remain undefined.
  // This is expected for a client-side focused Firebase setup.
}

export { app, auth };
