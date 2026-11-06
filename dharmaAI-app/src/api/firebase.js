// src/api/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCtwAu430OJ7if0nkVElM3QuhwOmGeOptc",
    authDomain: "dharma-ai-fdd59.firebaseapp.com",
    projectId: "dharma-ai-fdd59",
    appId: "1:907285674187:web:527afe02ae2993fb07434e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);