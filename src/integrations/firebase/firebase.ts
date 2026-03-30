import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  signOut 
} from "firebase/auth";

// These values should be provided by the user from their Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? import("firebase/analytics").then(m => m.getAnalytics(app)) : null;

// Providers - Firebase is ONLY used for Apple Sign-In bridge
export const appleProvider = new OAuthProvider('apple.com');

export const signInWithFirebase = async (providerId: string) => {
  if (providerId !== 'apple') {
    throw new Error("ClientFlow OS: Use Supabase for all providers except Apple.");
  }
  return signInWithPopup(auth, appleProvider);
};
