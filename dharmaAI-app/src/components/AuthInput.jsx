// src/components/AuthInput.jsx
// One input for every field. Pass `secure` to get the password eye toggle.
import { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AuthInput({ secure = false, ...props }) {
    const [hidden, setHidden] = useState(secure);

    return (
        <View className="mb-4 h-[52px] flex-row items-center rounded-2xl border-2 border-white px-4">
            <TextInput
                className="flex-1 text-base text-white"
                placeholderTextColor="#8A8F98"
                secureTextEntry={hidden}
                autoCapitalize="none"
                {...props}
            />
            {secure && (
                <TouchableOpacity onPress={() => setHidden((h) => !h)}>
                    <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color="#8A8F98" />
                </TouchableOpacity>
            )}
        </View>
    );
}