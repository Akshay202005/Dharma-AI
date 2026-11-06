// app/signup.js
import useGoogleAuth from "../src/hooks/useGoogleAuth.js";
import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import AuthLayout from "../src/components/AuthLayout";
import AuthInput from "../src/components/AuthInput";
import GoogleButton from "../src/components/GoogleButton";
import api from "../src/api/client";
import { saveToken } from "../src/utils/tokenStorage";
import { setUserData } from "../src/store/userSlice";

export default function Signup() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { googleSignin, googleLoading } = useGoogleAuth(setError);

    const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSignup = async () => {
        const { fullName, email, password, confirmPassword } = form;
        // quick checks on the phone for instant feedback; the backend still validates everything
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword)
            return setError("All fields are required.");
        if (password.length < 8) return setError("Password must be at least 8 characters long.");
        if (password !== confirmPassword) return setError("Passwords do not match.");

        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/signup", { ...form, fullName: fullName.trim() });
            const { token, ...userData } = data;
            await saveToken(token);
            dispatch(setUserData(userData));
        } catch (e) {
            setError(
                e.response?.data?.message ||
                (e.code === "ERR_NETWORK" ? "Can't reach the server. Check your connection." : "Something went wrong. Try again.")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Sign up" onBack={() => (router.canGoBack() ? router.back() : null)}>
            <AuthInput placeholder="Full Name" value={form.fullName} onChangeText={setField("fullName")}
                autoCapitalize="words" />
            <AuthInput placeholder="Email" value={form.email} onChangeText={setField("email")}
                keyboardType="email-address" autoComplete="email" />
            <AuthInput placeholder="Password" value={form.password} onChangeText={setField("password")} secure />
            <AuthInput placeholder="Confirm Password" value={form.confirmPassword}
                onChangeText={setField("confirmPassword")} secure />

            {!!error && <Text className="mb-2 text-center text-[#FF6B6B]">{error}</Text>}

            <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="h-[42px] min-w-[120px] items-center justify-center self-center rounded-lg border-[1.5px] border-[#A87A22] px-6"
            >
                {loading
                    ? <ActivityIndicator color="#FFD76A" />
                    : <Text className="text-base font-semibold text-[#FFD76A]">Sign up</Text>}
            </TouchableOpacity>

            <View className="my-5 flex-row items-center">
                <View className="h-px flex-1 bg-[#8A8F98]/60" />
                <Text className="mx-2 text-[#8A8F98]">OR</Text>
                <View className="h-px flex-1 bg-[#8A8F98]/60" />
            </View>

            <GoogleButton disabled={loading || googleLoading} onPress={googleSignin} />

            <View className="mt-2 flex-row justify-center">
                <Text className="text-[#8A8F98]">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/signin")}>
                    <Text className="font-semibold text-[#FFD76A]">Sign in</Text>
                </TouchableOpacity>
            </View>
        </AuthLayout>
    );
}