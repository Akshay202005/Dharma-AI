// src/components/ProfileUI.js
import { useEffect, useState } from "react"; // NEW
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Keyboard, // NEW
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "./Navbar";

const LOGO = require("../../assets/imgs/Logo.png"); // <-- change to your logo file name

/* Shared page frame: cosmic background, corner logo, content area, Navbar at the bottom.
   Same structure as Home and Chat, so all screens line up. */
export const PageShell = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // NEW: hide the Navbar while typing, same idea as Chat.js. Without this the keyboard
  // covers the Navbar and forms (like Contact) can't scroll properly.
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/imgs/BG_Cosmic.png")}
      className="flex-1 bg-[#03060C]"
      resizeMode="cover"
    >
      <Image
        source={LOGO}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 z-10 h-11 w-11"
        resizeMode="contain"
      />
      <View className="flex-1" style={{ paddingTop: insets.top + 52 }}>
        {children}
      </View>
      {!keyboardOpen && <Navbar />}
    </ImageBackground>
  );
};

/* Back arrow (left) + centered title. `divider` shows the line under it:
   Settings and Help have it, About and Contact don't (see your images). */
export const BackHeader = ({ title, divider = true }) => {
  const router = useRouter();

  // If there is no previous screen (e.g. the page was opened directly), go Home instead
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View className={divider ? "mb-6" : "mb-3"}>
      <View className="flex-row items-center justify-center h-10">
        <Pressable onPress={goBack} hitSlop={10} className="absolute left-0">
          <Ionicons name="arrow-back-circle-outline" size={34} color="#fff" />
        </Pressable>
        <Text className="text-white text-2xl font-bold">{title}</Text>
      </View>
      {divider && <View className="h-px bg-gray-400 mt-4 mx-8" />}
    </View>
  );
};

/* The pill-shaped row used on Profile, Settings and Help: icon | label | optional chevron */
export const MenuButton = ({
  icon,
  label,
  onPress,
  danger = false,
  disabled = false,
  chevron = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className={`flex-row items-center h-12 rounded-full border-2 px-4 mb-4 active:opacity-70 ${
      danger ? "border-red-500" : "border-white"
    } ${disabled ? "opacity-40" : ""}`}
  >
    {icon}
    <Text className={`flex-1 ml-3 text-sm font-bold ${danger ? "text-red-500" : "text-white"}`}>
      {label}
    </Text>
    {chevron && <Ionicons name="chevron-forward" size={18} color="#fff" />}
  </Pressable>
);

/* ---------- Modal pieces (moved here unchanged from your old Profile.js) ----------
   They live OUTSIDE any page component on purpose: a component declared inside another
   is re-created on every render, which makes TextInputs lose focus while typing. */

export const ModalCard = ({ title, onClose, children }) => (
  <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black/70 items-center justify-center px-6"
    >
      <View className="w-full rounded-3xl border-2 border-[#A87A22] bg-[#03060C] p-5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
        {children}
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

export const PillInput = (props) => (
  <TextInput
    placeholderTextColor="#8a8a8a"
    autoCapitalize="none"
    className="h-12 rounded-full border border-white/60 px-5 text-white mb-3"
    {...props}
  />
);

export const StatusText = ({ status }) =>
  status.text ? (
    <Text
      className={`mb-3 text-center font-medium ${
        status.type === "success" ? "text-green-400" : "text-red-400"
      }`}
    >
      {status.text}
    </Text>
  ) : null;

export const ModalButtons = ({
  onClose,
  onSubmit,
  loading,
  label,
  disabled,
  danger,
  closeLabel = "Cancel",
}) => (
  <View className="flex-row justify-end gap-3 mt-1">
    <Pressable
      onPress={onClose}
      className="px-5 h-11 rounded-full border border-gray-400 items-center justify-center"
    >
      <Text className="text-white font-semibold">{closeLabel}</Text>
    </Pressable>
    <Pressable
      onPress={onSubmit}
      disabled={loading || disabled}
      className={`px-6 h-11 rounded-full items-center justify-center active:opacity-80 ${
        danger ? "bg-red-500" : "bg-[#FFD76A]"
      } ${loading || disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={danger ? "#fff" : "#03060C"} />
      ) : (
        <Text className={`font-bold ${danger ? "text-white" : "text-[#03060C]"}`}>{label}</Text>
      )}
    </Pressable>
  </View>
);