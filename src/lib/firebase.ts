// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Added Firestore import

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined; // Added db declaration
let firebaseInitializationError: string | null = null;

// This function is called by DataContext to get the error
export const getFirebaseInitializationError = () => firebaseInitializationError;

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredEnvVars: (keyof typeof firebaseConfigValues)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
];

const missingVars = requiredEnvVars.filter(key => !firebaseConfigValues[key]);

if (missingVars.length > 0) {
  firebaseInitializationError = `Firebase initialization failed: Missing environment variables: ${missingVars.map(v => `NEXT_PUBLIC_FIREBASE_${v.toUpperCase()}`).join(', ')}. Please check your .env.local file.`;
  console.error(firebaseInitializationError);
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfigValues as any);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error: any) {
    firebaseInitializationError = `Firebase initialization failed: ${error.message}`;
    console.error(firebaseInitializationError, error);
  }
}

export { app, auth, db }; // Added db to exports
