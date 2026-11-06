// src/hooks/useGoogleAuth.js
import { useState } from "react";
import { useDispatch } from "react-redux";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../api/firebase";
import api from "../api/client";
import { GOOGLE_WEB_CLIENT_ID } from "../config";
import { saveToken } from "../utils/tokenStorage";
import { setUserData } from "../store/userSlice";

// Loaded inside try/catch so the app doesn't crash where the native module is missing (e.g. Expo Go)
let GoogleSignin = null;
try {
    GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
} catch (e) {
    GoogleSignin = null;
}

export default function useGoogleAuth(onError) {
    const dispatch = useDispatch();
    const [googleLoading, setGoogleLoading] = useState(false);

    const googleSignin = async () => {
        if (!GoogleSignin) {
            return onError("Google sign-in works only in the development build, not Expo Go.");
        }
        onError("");
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signOut().catch(() => {});

            const res = await GoogleSignin.signIn();
            const googleIdToken = res.data?.idToken ?? res.idToken;
            if (!googleIdToken) return;

            const credential = GoogleAuthProvider.credential(googleIdToken);
            const result = await signInWithCredential(auth, credential);
            const firebaseIdToken = await result.user.getIdToken();

            const { data } = await api.post("/auth/google-auth", { idToken: firebaseIdToken });
            const { token, ...userData } = data;
            await saveToken(token);
            dispatch(setUserData(userData));
        } catch (e) {
            if (e.code === "SIGN_IN_CANCELLED" || e.code === "-5") return;
            onError(e.response?.data?.message || "Google sign-in failed. Try again.");
        } finally {
            setGoogleLoading(false);
        }
    };

    return { googleSignin, googleLoading };
}