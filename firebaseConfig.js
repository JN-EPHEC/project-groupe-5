// firebaseConfig.js
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ SENSIBLE : ne colle pas les clés ici, juste l'import.
import firebaseConfig from "./firebase.env";
// ou: import { firebaseConfig } from "./firebase.env";
// selon comment tu exportes dans firebase.env.js

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;
