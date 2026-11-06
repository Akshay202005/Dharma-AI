import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(new URL("./serviceAccountKey.json", import.meta.url), "utf8"));


if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = getAuth();