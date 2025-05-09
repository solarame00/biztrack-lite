// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let firebaseInitializationError: string | null = null;

// This function is called by DataContext to get the error
export const getFirebaseInitializationError = () => firebaseInitializationError;

if (typeof window !== 'undefined') { // Ensure this only runs on the client-side
  // Define the config structure using environment variables
  // These NEXT_PUBLIC_ variables are replaced at build time by Next.js/Vercel
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
  };

  // For logging and checking, list the *expected* environment variable names
  const expectedEnvVars: { key: keyof typeof firebaseConfig; name: string; isOptional?: boolean }[] = [
    { key: 'apiKey', name: 'NEXT_PUBLIC_FIREBASE_API_KEY' },
    { key: 'authDomain', name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' },
    { key: 'projectId', name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' },
    { key: 'storageBucket', name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' },
    { key: 'messagingSenderId', name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' },
    { key: 'appId', name: 'NEXT_PUBLIC_FIREBASE_APP_ID' },
    { key: 'measurementId', name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', isOptional: true },
  ];

  const missingOrEmptyEssentials: string[] = [];

  expectedEnvVars.forEach(envVar => {
    if (envVar.isOptional) return; // Skip optional ones like measurementId for this check

    const value = firebaseConfig[envVar.key];
    if (typeof value !== 'string' || value.trim() === '') {
      missingOrEmptyEssentials.push(envVar.name);
    }
  });

  if (missingOrEmptyEssentials.length > 0) {
    firebaseInitializationError =
      `Firebase Initialization Failed: The following Firebase environment variables are missing or empty: ${missingOrEmptyEssentials.join(', ')}. ` +
      "Please ensure they are correctly set in your .env.local file (for local development) or in your hosting provider's (e.g., Vercel) environment variable settings for the correct deployment environment (e.g., Production, Preview). " +
      "Firebase initialization will be skipped. Double-check names for typos (e.g., ensure 'NEXT_PUBLIC_FIREBASE_...') and values for accidental spaces or incorrect quoting.";
    console.error(firebaseInitializationError); // This is the line (around 51) indicated in your error log
  } else {
    // All essential keys are present, proceed with initialization
    const configForFirebaseSDK = {
      apiKey: firebaseConfig.apiKey!, 
      authDomain: firebaseConfig.authDomain!,
      projectId: firebaseConfig.projectId!,
      storageBucket: firebaseConfig.storageBucket!,
      messagingSenderId: firebaseConfig.messagingSenderId!,
      appId: firebaseConfig.appId!,
      ...(firebaseConfig.measurementId && firebaseConfig.measurementId.trim() !== '' && { measurementId: firebaseConfig.measurementId })
    };

    try {
      if (!getApps().length) {
        app = initializeApp(configForFirebaseSDK);
      } else {
        app = getApp();
      }

      if (app) {
        try {
          auth = getAuth(app);
        } catch (authError: any) {
          console.error("Firebase getAuth() failed:", authError);
          let specificAuthErrorMessage = `Firebase getAuth() failed: ${authError.message}. Code: ${authError.code || 'N/A'}`;
          if (authError.code === 'auth/configuration-not-found') {
             specificAuthErrorMessage =
              "Firebase Auth Error (auth/configuration-not-found) during getAuth(): " +
              "This usually means that the Authentication service is not properly enabled or configured for your Firebase project in the Firebase Console. " +
              "Please go to your Firebase project settings -> Authentication -> Sign-in method, and ensure the desired providers (e.g., Email/Password, Google) are enabled.";
          } else if (authError.code === 'auth/invalid-api-key') {
             specificAuthErrorMessage = `Firebase Auth Error (auth/invalid-api-key): The API key used for Firebase Auth is invalid. Please verify its value in your environment variables and Firebase console. Configured API key was: ${configForFirebaseSDK.apiKey ? configForFirebaseSDK.apiKey.substring(0,8) + '...' : 'MISSING'}`;
          }
          firebaseInitializationError = specificAuthErrorMessage;
        }
      } else {
        const appUndefinedError = "Firebase app object is undefined after initialization attempt. Cannot get Auth instance.";
        firebaseInitializationError = appUndefinedError;
      }
    } catch (initError: any) {
      console.error("An error occurred during Firebase app initialization (initializeApp or getApp call):", initError);
      let specificInitErrorMessage = `Firebase app initialization failed: ${initError.message}. Code: ${initError.code || 'N/A'}`;
       if (initError.code === 'auth/invalid-api-key' || initError.message?.includes('Invalid API key')) {
        specificInitErrorMessage = `Firebase Error (invalid-api-key) during initializeApp: The API key in firebaseConfig is invalid. Please verify its value in your environment variables (NEXT_PUBLIC_FIREBASE_API_KEY) and Firebase console. Configured API key was: ${configForFirebaseSDK.apiKey ? configForFirebaseSDK.apiKey.substring(0,8) + '...' : 'MISSING'}`;
      }
      firebaseInitializationError = specificInitErrorMessage;
    }
  }
}

export { app, auth };
