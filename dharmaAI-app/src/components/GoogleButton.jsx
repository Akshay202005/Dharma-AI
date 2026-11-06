// src/components/GoogleButton.jsx
// Colored letters, so no image asset is needed.
import { Text, TouchableOpacity, View } from "react-native";

const letters = [
    ["G", "#4285F4"], ["o", "#EA4335"], ["o", "#FBBC05"],
    ["g", "#4285F4"], ["l", "#34A853"], ["e", "#EA4335"],
];

export default function GoogleButton({ onPress, disabled }) {
    return (
        <TouchableOpacity className="my-2 flex-row items-center justify-center" onPress={onPress} disabled={disabled}>
            <Text className="text-xl text-white">Continue with </Text>
            <View className="flex-row">
                {letters.map(([ch, color], i) => (
                    <Text key={i} className="text-xl font-semibold" style={{ color }}>{ch}</Text>
                ))}
            </View>
        </TouchableOpacity>
    );
}