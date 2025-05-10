// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let firebaseInitializationError: string | null = null;

// This function is called by DataContext to get the error
export const getFirebaseInitializationError = () => firebaseInitializationError;

if (typeof window !== 'undefined') { // Ensure this only runs on the client-side
  firebaseInitializationError = null; // Reset error state

  const firebaseConfigValues = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
  };

  // Array of expected environment variables and their actual names for error messages
  const expectedEnvVars: { key: keyof typeof firebaseConfigValues; name: string; isOptional?: boolean }[] = [
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
    if (envVar.isOptional) return; // Skip optional vars like measurementId if they are truly optional

    const value = firebaseConfigValues[envVar.key];
    // Check if the value is actually a string and not just an empty string or undefined
    if (typeof value !== 'string' || value.trim() === '') {
      missingOrEmptyEssentials.push(envVar.name);
    }
  });

  if (missingOrEmptyEssentials.length > 0) {
    firebaseInitializationError =
      `Firebase Initialization Failed: The following Firebase environment variables are missing or empty: ${missingOrEmptyEssentials.join(', ')}. ` +
      "Please ensure they are correctly set in your .env.local file (for local development) or in your hosting provider's (e.g., Vercel) environment variable settings for the correct deployment environment (e.g., Production, Preview). " +
      "Firebase initialization will be skipped. Double-check names for typos (e.g., ensure 'NEXT_PUBLIC_FIREBASE_...') and values for accidental spaces or incorrect quoting.";
    console.error(firebaseInitializationError); // Log this error directly when it occurs
  } else {
    // All essential keys are present, proceed with initialization
    // Construct the config object for Firebase SDK, ensuring values are strings
    const configForFirebaseSDK = {
      apiKey: firebaseConfigValues.apiKey!, // Use ! as we've checked they are strings and not empty
      authDomain: firebaseConfigValues.authDomain!,
      projectId: firebaseConfigValues.projectId!,
      storageBucket: firebaseConfigValues.storageBucket!,
      messagingSenderId: firebaseConfigValues.messagingSenderId!,
      appId: firebaseConfigValues.appId!,
      // Conditionally add measurementId only if it's present and not empty
      ...(firebaseConfigValues.measurementId && firebaseConfigValues.measurementId.trim() !== '' && { measurementId: firebaseConfigValues.measurementId })
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
          // A simple check, though specific errors from Firebase are more telling if auth itself fails
          if (!auth.app) { 
             const authInitIssue = "Firebase Auth object initialized but its 'app' property is missing. This might indicate an incomplete Auth initialization or configuration issue within Firebase services (e.g., Authentication not fully enabled or misconfigured in the Firebase console).";
             // Prepend to existing error or set if no prior error
             firebaseInitializationError = firebaseInitializationError ? `${authInitIssue} ${firebaseInitializationError}`: authInitIssue;
             console.error(authInitIssue, "Auth object:", auth);
          }
        } catch (authError: any) {
          let specificAuthErrorMessage = `Firebase getAuth() failed: ${authError.message}. Code: ${authError.code || 'N/A'}.`;
          if (authError.code === 'auth/configuration-not-found') {
             specificAuthErrorMessage =
              "Firebase Auth Error (auth/configuration-not-found) during getAuth(): " +
              "This usually means that the Authentication service is not properly enabled or configured for your Firebase project in the Firebase Console. " +
              "Please go to your Firebase project settings -> Authentication -> Sign-in method, and ensure the desired providers (e.g., Email/Password, Google) are enabled.";
          } else if (authError.code === 'auth/invalid-api-key') {
             specificAuthErrorMessage = `Firebase Auth Error (auth/invalid-api-key): The API key used for Firebase Auth is invalid. Please verify its value in your environment variables and Firebase console. Configured API key started with: ${configForFirebaseSDK.apiKey ? configForFirebaseSDK.apiKey.substring(0,8) + '...' : 'MISSING'}`;
          }
          firebaseInitializationError = specificAuthErrorMessage;
          console.error(specificAuthErrorMessage, authError); // Log auth-specific errors
        }
      } else {
        const appUndefinedError = "Firebase app object is undefined after initialization attempt. Cannot get Auth instance.";
        firebaseInitializationError = firebaseInitializationError ? `${appUndefinedError} ${firebaseInitializationError}`: appUndefinedError;
        console.error(appUndefinedError);
      }
    } catch (initError: any) {
      let specificInitErrorMessage = `Firebase app initialization (initializeApp/getApp) failed: ${initError.message}. Code: ${initError.code || 'N/A'}.`;
       if (initError.code === 'auth/invalid-api-key' || initError.message?.includes('Invalid API key')) {
        specificInitErrorMessage = `Firebase Error (invalid-api-key) during initializeApp: The API key in firebaseConfig is invalid. Please verify its value in your environment variables (NEXT_PUBLIC_FIREBASE_API_KEY) and Firebase console. Configured API key started with: ${configForFirebaseSDK.apiKey ? configForFirebaseSDK.apiKey.substring(0,8) + '...' : 'MISSING'}`;
      }
      firebaseInitializationError = specificInitErrorMessage;
      console.error(specificInitErrorMessage, initError); // Log app init errors
    }
  }
}

export { app, auth };
