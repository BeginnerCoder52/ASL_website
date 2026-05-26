import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const maskKey = (k) => k ? k.substring(0, 8) + "..." + k.slice(-4) : "(empty)";

const rawApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const rawAuthDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
const rawProjectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

console.log("[Firebase] API Key:", maskKey(rawApiKey));
console.log("[Firebase] Auth Domain:", rawAuthDomain);
console.log("[Firebase] Project ID:", rawProjectId);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("[Firebase] Init OK — project:", rawProjectId);
} catch (e) {
  console.error("[Firebase] Init failed:", e.message, "| code:", e.code);
  console.warn("[Firebase] Kiem tra:");
  console.warn("  1. Vercel Dashboard → Project Settings → Env vars:");
  console.warn("     XOA cac REACT_APP_FIREBASE_* neu co (de .env duoc dung)");
  console.warn("  2. Firebase Console → Authentication da bat chua?");
  console.warn("  3. Google Cloud Console → API key co bi gioi han domain?");
}
export { auth, db };
export default app;
