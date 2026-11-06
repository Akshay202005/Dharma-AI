import { useState } from "react";
import { Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import AuthLayout from "../src/components/AuthLayout";
import AuthInput from "../src/components/AuthInput";
import api from "../src/api/client";

const TITLES = { 1: "Forgot Password", 2: "Verify OTP", 3: "New Password" };

// Shows the backend's message if there is one, a friendly fallback otherwise
const getMessage = (e) =>
    e.response?.data?.message ||
    (e.code === "ERR_NETWORK" ? "Can't reach the server. Check your connection." : "Something went wrong. Try again.");

export default function ForgotPassword() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Back arrow: step 1 leaves the screen, steps 2 and 3 return to step 1
    const handleBack = () => {
        setError("");
        if (step === 1) {
            router.canGoBack() ? router.back() : router.replace("/signin");
        } else {
            setOtp("");
            setStep(1);
        }
    };

    // Step 1 (and "Resend OTP" on step 2)
    const handleSendOtp = async (isResend = false) => {
        if (!email.trim()) return setError("Email is required.");
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/send-otp", { email });
            if (isResend) Alert.alert("OTP sent", "A new OTP has been sent to your email.");
            else setStep(2);
        } catch (e) {
            setError(getMessage(e));
        } finally {
            setLoading(false);
        }
    };

    // Step 2
    const handleVerifyOtp = async () => {
        if (otp.length !== 4) return setError("Enter the 4-digit OTP.");
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/verify-otp", { email, otp });
            setStep(3);
        } catch (e) {
            setError(getMessage(e));
        } finally {
            setLoading(false);
        }
    };

    // Step 3
    const handleResetPassword = async () => {
        if (newPassword.length < 8) return setError("Password must be at least 8 characters long.");
        if (newPassword !== confirmPassword) return setError("Passwords do not match.");
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { email, newPassword });
            Alert.alert("Success", "Your password has been reset. Please sign in.");
            router.replace("/signin");
        } catch (e) {
            setError(getMessage(e));
        } finally {
            setLoading(false);
        }
    };

    const actions = {
        1: { label: "Send OTP", onPress: () => handleSendOtp(false) },
        2: { label: "Verify", onPress: handleVerifyOtp },
        3: { label: "Reset Password", onPress: handleResetPassword },
    };

    return (
        <AuthLayout title={TITLES[step]} onBack={handleBack}>
            {step === 1 && (
                <>
                    <Text className="mb-4 text-center text-[#8A8F98]">
                        Enter your email and we'll send you an OTP.
                    </Text>
                    <AuthInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                </>
            )}

            {step === 2 && (
                <>
                    <Text className="mb-4 text-center text-[#8A8F98]">
                        We sent a 4-digit OTP to {email}. It expires in 5 minutes.
                    </Text>
                    <AuthInput
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ""))}
                        keyboardType="number-pad"
                        maxLength={4}
                    />
                    <TouchableOpacity onPress={() => handleSendOtp(true)} disabled={loading}>
                        <Text className="mb-4 text-center text-[#FFD76A]">Resend OTP</Text>
                    </TouchableOpacity>
                </>
            )}

            {step === 3 && (
                <>
                    <AuthInput placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secure />
                    <AuthInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secure />
                </>
            )}

            {!!error && <Text className="mb-3 text-center text-[#FF6B6B]">{error}</Text>}

            <TouchableOpacity
                onPress={actions[step].onPress}
                disabled={loading}
                className="h-[42px] min-w-[120px] items-center justify-center self-center rounded-lg border-[1.5px] border-[#A87A22] px-6"
            >
                {loading
                    ? <ActivityIndicator color="#FFD76A" />
                    : <Text className="text-base font-semibold text-[#FFD76A]">{actions[step].label}</Text>}
            </TouchableOpacity>
        </AuthLayout>
    );
}