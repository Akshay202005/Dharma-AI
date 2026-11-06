// app/signin.js
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

export default function Signin() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { googleSignin, googleLoading } = useGoogleAuth(setError);

    const handleSignin = async () => {
        if (!email.trim() || !password) return setError("Email and password are required.");
        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/signin", { email, password });
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
        <AuthLayout title="Sign in" onBack={() => (router.canGoBack() ? router.back() : null)}>
            <AuthInput placeholder="Email" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoComplete="email" />
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secure />

            {!!error && <Text className="mb-2 text-center text-[#FF6B6B]">{error}</Text>}

            <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text className="mb-5 text-center text-[#FFD76A]">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleSignin}
                disabled={loading}
                className="h-[42px] min-w-[120px] items-center justify-center self-center rounded-lg border-[1.5px] border-[#A87A22] px-6"
            >
                {loading
                    ? <ActivityIndicator color="#FFD76A" />
                    : <Text className="text-base font-semibold text-[#FFD76A]">Sign in</Text>}
            </TouchableOpacity>

            <View className="my-6 flex-row items-center">
                <View className="h-px flex-1 bg-[#8A8F98]/60" />
                <Text className="mx-2 text-[#8A8F98]">OR</Text>
                <View className="h-px flex-1 bg-[#8A8F98]/60" />
            </View>

            <GoogleButton disabled={loading || googleLoading} onPress={googleSignin} />

            <View className="mt-2 flex-row justify-center">
                <Text className="text-[#8A8F98]">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/signup")}>
                    <Text className="font-semibold text-[#FFD76A]">Sign up</Text>
                </TouchableOpacity>
            </View>
        </AuthLayout>
    );
}