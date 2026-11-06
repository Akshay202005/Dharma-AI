import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Input({ label, error, secure = false, ...props }) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="mb-4">
      {label ? <Text className="mb-1.5 text-sm text-ivory">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-xl border bg-white/5 px-4 ${
          error ? "border-red-400" : "border-gold/30"
        }`}
      >
        <TextInput
          className="flex-1 py-3.5 text-base text-ivory"
          placeholderTextColor="#8A8F9C"
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color="#8A8F9C" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1 text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}