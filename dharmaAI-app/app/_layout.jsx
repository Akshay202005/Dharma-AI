import "../global.css";
import { Provider, useSelector } from "react-redux";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { store } from "../src/store/store";
import useGetCurrentUser from "../src/hooks/useGetCurrentUser";

function RootStack() {
    useGetCurrentUser();
    const { isAuthenticated, authChecked } = useSelector((s) => s.user);

    if (!authChecked) {
        return (
            <View className="flex-1 items-center justify-center bg-[#03060C]">
                <ActivityIndicator size="large" color="#FFD76A" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Public: everyone */}
            <Stack.Screen name="index" />
            <Stack.Screen name="Home" />
            <Stack.Screen name="About" />
            <Stack.Screen name="Contact" />

            {/* Guests only */}
            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="signin" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="forgot-password" />
            </Stack.Protected>

            {/* Logged-in only */}
            <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="Chat" />
                <Stack.Screen name="Profile" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <RootStack />
        </Provider>
    );
}