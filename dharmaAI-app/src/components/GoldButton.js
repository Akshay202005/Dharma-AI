import { Pressable, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GoldButton({ title, onPress, loading = false, disabled = false }) {
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      className={`overflow-hidden rounded-xl ${inactive ? "opacity-60" : "active:opacity-80"}`}
    >
      <LinearGradient
        colors={["#FFD76A", "#A87A22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 14, alignItems: "center" }}
      >
        {loading ? (
          <ActivityIndicator color="#03060C" />
        ) : (
          <Text className="text-base font-semibold text-cosmic">{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}