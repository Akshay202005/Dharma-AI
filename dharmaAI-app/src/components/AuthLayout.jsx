// src/components/AuthLayout.jsx
// Shared frame for both screens: background, rounded card, back button, centered title.
// ScrollView + KeyboardAvoidingView keep inputs visible on small phones.
import {
    ImageBackground, View, Text, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AuthLayout({ title, onBack, children }) {
    return (
        <ImageBackground
            source={require("../../assets/imgs/BG_Cosmic.png")}
            className="flex-1 bg-[#03060C]"
            resizeMode="cover"
        >
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="rounded-[40px] border-2 border-white/40 bg-[#03060C]/90 px-6 py-8">
                            <View className="mb-7 flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={onBack}
                                    className="h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-white"
                                >
                                    <Ionicons name="arrow-back" size={20} color="#fff" />
                                </TouchableOpacity>
                                <Text className="text-[28px] font-bold text-white">{title}</Text>
                                <View className="h-9 w-9" />
                            </View>
                            {children}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}