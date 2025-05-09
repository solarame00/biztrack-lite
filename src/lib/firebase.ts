// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let firebaseInitializationError: string | null = null; // Store initialization error

// This function is called by DataContext to get the error
export const getFirebaseInitializationError = () => firebaseInitializationError;


if (typeof window !== 'undefined') { // Ensure this only runs on the client-side
  // Firebase configuration will be sourced from environment variables
  // Moved inside the client-side check
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional, can be undefined
  };

  const essentialKeys: (keyof Omit<typeof firebaseConfig, 'measurementId'>)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeysDetails = essentialKeys.filter(key => {
    const value = firebaseConfig[key]; // Accessing values from the firebaseConfig object
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missingKeysDetails.length > 0) {
    const missingVarNames = missingKeysDetails.map(key => {
        // Construct the expected environment variable name
        const envVarKey = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        return envVarKey;
    });

    firebaseInitializationError =
      `Firebase Initialization Failed: The following Firebase environment variables are missing or empty: ${missingVarNames.join(', ')}. ` +
      "Please ensure they are correctly set in your .env.local file (for local development) or in your hosting provider's (e.g., Vercel) environment variable settings for the correct deployment environment (e.g., Production, Preview). " +
      "Firebase initialization will be skipped. Double-check names for typos (e.g., ensure 'NEXT_PUBLIC_FIREBASE_...') and values for accidental spaces or incorrect quoting.";
    console.error(firebaseInitializationError);
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
          // console.log("Firebase Auth initialized successfully."); // For debugging, remove for production
        } catch (authError: any) {
          console.error("Firebase getAuth() failed:", authError);
          let specificAuthErrorMessage = `Firebase getAuth() failed: ${authError.message}. Code: ${authError.code}`;
          if (authError.code === 'auth/configuration-not-found') {
            specificAuthErrorMessage =
              "Firebase Auth Error (auth/configuration-not-found) during getAuth(): " +
              "This usually means that the Authentication service is not properly enabled or configured for your Firebase project in the Firebase Console. " +
              "Please go to your Firebase project settings -> Authentication -> Sign-in method, and ensure the desired providers (e.g., Email/Password, Google) are enabled.";
          } else if (authError.code === 'auth/invalid-api-key') {
             specificAuthErrorMessage = `Firebase Auth Error (auth/invalid-api-key): The API key (${firebaseConfig.apiKey ? 'provided starting with ' + firebaseConfig.apiKey.substring(0,8) + '...' : 'MISSING'}) used for Firebase Auth is invalid. Please verify its value in your environment variables and Firebase console.`;
          }
          console.error(specificAuthErrorMessage);
          firebaseInitializationError = specificAuthErrorMessage;
        }
      } else {
        const appUndefinedError = "Firebase app object is undefined after initialization attempt. Cannot get Auth instance.";
        console.error(appUndefinedError);
        firebaseInitializationError = appUndefinedError;
      }
    } catch (initError: any) {
      console.error("An error occurred during Firebase app initialization (initializeApp or getApp call):", initError);
      let specificInitErrorMessage = `Firebase app initialization failed: ${initError.message}. Code: ${initError.code}`;
      if (initError.code === 'auth/invalid-api-key' || initError.message?.includes('Invalid API key')) {
        specificInitErrorMessage = `Firebase Error (invalid-api-key) during initializeApp: The API key (${firebaseConfig.apiKey ? 'provided starting with ' + firebaseConfig.apiKey.substring(0,8) + '...' : 'MISSING'}) in firebaseConfig is invalid. Please verify its value in your environment variables (NEXT_PUBLIC_FIREBASE_API_KEY) and Firebase console.`;
      }
      console.error(specificInitErrorMessage);
      firebaseInitializationError = specificInitErrorMessage;
    }
  }
}

export { app, auth };
