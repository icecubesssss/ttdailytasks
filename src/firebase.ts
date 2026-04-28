import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:123456789"
};

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const appId: string = import.meta.env.VITE_APP_ID || 'tt-daily-task';
export const geminiApiKey: string = import.meta.env.VITE_GEMINI_API_KEY || "";
export const isDummyConfig: boolean = firebaseConfig.apiKey === "dummy-key";

// Google Calendar Integration
export const googleCalendarApiKey: string = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || "";
export const calendarIdTit: string = import.meta.env.VITE_CALENDAR_ID_TIT || "";
export const calendarIdTun: string = import.meta.env.VITE_CALENDAR_ID_TUN || "";

// Google Apps Script Calendar Proxy (preferred over direct API)
export const appsScriptUrl: string = import.meta.env.VITE_APPS_SCRIPT_URL || "";
