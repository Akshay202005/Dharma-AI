import { useRef, useCallback } from "react";
import {
    View,
    Text,
    Image,
    ImageBackground,
    Pressable,
    Animated,
    Easing,
    useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../src/components/Navbar";

// ====== TWEAK THESE TWO NUMBERS ======
const RISE_DURATION = 2500; // milliseconds: higher = slower float, lower = faster
const RISE_DISTANCE = 120;  // pixels Krishna starts below his final position
// =====================================

export default function Home() {
    const router = useRouter();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const user = useSelector((s) => s.user.userData);

    // 0 = start of the rise, 1 = Krishna at his final position
    const rise = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            rise.setValue(0);

            const anim = Animated.timing(rise, {
                toValue: 1,
                duration: RISE_DURATION,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            });
            anim.start();

            return () => anim.stop();
        }, [rise])
    );

    const translateY = rise.interpolate({
        inputRange: [0, 1],
        outputRange: [RISE_DISTANCE, 0],
    });
    const opacity = rise.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0, 1, 1],
    });

    const handleTalk = () => {
        router.push(user ? "/Chat" : "/signin");
    };

    return (
        <ImageBackground
            source={require("../assets/imgs/BG_Cosmic.png")}
            className="flex-1 bg-[#03060C]"
            resizeMode="cover"
        >
            {/* NEW: small logo pinned to the top-left corner */}
            <Image
                source={require("../assets/imgs/Logo.png")} // <-- change to your logo file
                style={{ top: insets.top + 8 }}
                className="absolute left-4 z-10 h-11 w-11"
                resizeMode="contain"
            />

            {/* CHANGED: top padding now clears the status bar + corner logo
                (the Navbar no longer sits above this block) */}
            <View
                style={{ paddingTop: insets.top + 52 }}
                className="flex-1 items-center px-6"
            >
                <Image
                    source={require("../assets/imgs/Dharma_AI.png")}
                    style={{ aspectRatio: 3 }}
                    className="-my-6 w-[85%]"
                    resizeMode="contain"
                />

                <Text className="mt-2 text-center text-xl font-bold text-white">
                    Ancient Wisdom. Modern AI.{"\n"}Meaningful Guidance.
                </Text>
                <Text className="mt-2 text-center text-md leading-[18px] text-[#C9CED8]">
                    Seek clarity. Reflect deeply.{"\n"}Grow with timeless wisdom.
                </Text>

                <View
                    style={{ height: height * 0.4 }}
                    className="mt-4 w-full items-center justify-center"
                >
                    <Animated.View
                        style={{
                            width: "100%",
                            height: "100%",
                            opacity,
                            transform: [{ translateY }],
                        }}
                    >
                        <Image
                            source={require("../assets/imgs/Krishna-Hero.png")}
                            className="h-full w-full"
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                {/* CHANGED: tighter spacing so the button sits just above the bottom bar */}
                <Pressable
                    onPress={handleTalk}
                    className="mb-4 mt-4 flex-row items-center gap-2.5 rounded-2xl border-[1.5px] border-[#A87A22] bg-[#03060C]/60 px-[22px] py-3 active:opacity-70"
                >
                    <Text className="text-[15px] text-[#FFD76A]">Talk with Krishna</Text>
                    <Ionicons name="arrow-forward-circle-outline" size={22} color="#FFD76A" />
                </Pressable>
            </View>

            {/* MOVED: Navbar now renders last, so it sits at the bottom */}
            <Navbar />
        </ImageBackground>
    );
}