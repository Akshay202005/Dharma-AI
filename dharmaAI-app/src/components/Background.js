import { ImageBackground, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Background({ children, className = "" }) {
  return (
    <View className="flex-1 bg-cosmic">
      <ImageBackground
        source={require("../../assets/imgs/BG_Cosmic.png")}
        resizeMode="cover"
        className="flex-1"
      >
        <SafeAreaView className={`flex-1 ${className}`}>{children}</SafeAreaView>
      </ImageBackground>
    </View>
  );
}