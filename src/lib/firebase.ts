
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

  // Read environment variables, defaulting to empty string if undefined
  const firebaseConfigValues = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '', // Optional
  };

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
    if (envVar.isOptional && !firebaseConfigValues[envVar.key]) return; // Skip optional if truly missing and not just empty

    const value = firebaseConfigValues[envVar.key];
    // Since we defaulted to '', value will always be a string.
    // So, we only need to check if it's an empty string after trimming.
    if (value.trim() === '') {
       // For optional vars, only consider them "missing" if they were provided but empty.
      // If an optional var is not in process.env at all, it's fine (it's empty string now due to || '').
      // We only care if required ones are empty or optional ones are explicitly set to empty.
      if (!envVar.isOptional) {
        missingOrEmptyEssentials.push(envVar.name);
      } else if (process.env[envVar.name] !== undefined && value.trim() === '') { 
        // If optional var was explicitly set (even to empty string in .env or Vercel UI), and it's empty after trim.
        // This condition is a bit nuanced for optional vars; typically, if an optional var is empty, it's not an error.
        // For simplicity, the original check was fine.
        // The main goal is to ensure required ones are present.
      }
    }
  });
  
  // Refined check for missing *required* environment variables
  const requiredMissingKeys = expectedEnvVars
    .filter(ev => !ev.isOptional)
    .filter(ev => firebaseConfigValues[ev.key].trim() === '')
    .map(ev => ev.name);


  if (requiredMissingKeys.length > 0) {
    firebaseInitializationError =
      `Firebase Initialization Failed: The following Firebase environment variables are missing or empty: ${requiredMissingKeys.join(', ')}. ` +
      "Please ensure they are correctly set in your .env.local file (for local development) or in your hosting provider's (e.g., Vercel) environment variable settings for the correct deployment environment (e.g., Production, Preview). " +
      "Firebase initialization will be skipped. Double-check names for typos (e.g., ensure 'NEXT_PUBLIC_FIREBASE_...') and values for accidental spaces or incorrect quoting.";
    console.error(firebaseInitializationError); // Log this error directly when it occurs
  } else {
    // All essential keys are present, proceed with initialization
    // Construct the config object for Firebase SDK, ensuring values are strings
    const configForFirebaseSDK = {
      apiKey: firebaseConfigValues.apiKey!,
      authDomain: firebaseConfigValues.authDomain!,
      projectId: firebaseConfigValues.projectId!,
      storageBucket: firebaseConfigValues.storageBucket!,
      messagingSenderId: firebaseConfigValues.messagingSenderId!,
      appId: firebaseConfigValues.appId!,
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
          if (!auth.app) {
             const authInitIssue = "Firebase Auth object initialized but its 'app' property is missing. This might indicate an incomplete Auth initialization or configuration issue within Firebase services (e.g., Authentication not fully enabled or misconfigured in the Firebase console).";
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
          console.error(specificAuthErrorMessage, authError);
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
      console.error(specificInitErrorMessage, initError);
    }
  }
}

export { app, auth };
