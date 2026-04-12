import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const e = (v: string | undefined, fb: string) => (v || fb).trim();

const firebaseConfig = {
  apiKey:            e(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "placeholder"),
  authDomain:        e(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "placeholder.firebaseapp.com"),
  projectId:         e(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "placeholder"),
  storageBucket:     e(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "placeholder.appspot.com"),
  messagingSenderId: e(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "0"),
  appId:             e(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "1:0:web:placeholder"),
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
