// app/Chat.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image, // NEW: for the corner logo
  ImageBackground,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Easing,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // NEW
import Navbar from "../src/components/Navbar";
import useChat from "../src/hooks/useChat.js";
import useSpeech from "../src/hooks/useSpeech.js";
import useLimit from "../src/hooks/useLimit.js";

// ---------- Assets & theme ----------
const BG = require("../assets/imgs/BG_Cosmic.png");
const KRISHNA_IMG = require("../assets/imgs/Krishna.png");
const LOGO = require("../assets/imgs/Logo.png"); // NEW: <-- change to your logo file name
const GOLD = "#FFD76A";
const USER_BLUE = "#4F8CFF";
const SIDEBAR_W = Dimensions.get("window").width * 0.82;
const SIDEBAR_HIDDEN = -(SIDEBAR_W + 40); // keeps the closed sidebar fully off-screen

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// ---------- Small reusable pieces ----------
const IconBtn = ({ onPress, children, className = "" }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    className={`items-center justify-center ${className}`}
    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
  >
    {children}
  </Pressable>
);

// Square translucent button shown on top of the Krishna image
const OverlayBtn = ({ onPress, children }) => (
  <Pressable
    onPress={onPress}
    className="w-10 h-10 rounded-xl items-center justify-center border border-white/80"
    style={({ pressed }) => ({
      backgroundColor: "rgba(0,0,0,0.45)",
      opacity: pressed ? 0.7 : 1,
    })}
  >
    {children}
  </Pressable>
);

const Message = ({ item, onSpeak }) => {
  const isUser = item.sender === "User";
  return (
    <View className={`mb-5 ${isUser ? "items-end" : "items-start"}`}>
      <Text
        className="text-xs font-semibold mb-1"
        style={{ color: isUser ? USER_BLUE : GOLD }}
      >
        {isUser ? "You" : "Krishna"}
      </Text>

      <Text
        className={`text-white text-base leading-6 ${isUser ? "text-right" : "text-left"}`}
        style={{ maxWidth: "88%" }}
      >
        {item.content}
      </Text>

      {/* replay button under each Krishna reply */}
      {!isUser && (
        <IconBtn onPress={() => onSpeak(item)} className="mt-2 self-start">
          <Ionicons name="volume-medium-outline" size={18} color={GOLD} />
        </IconBtn>
      )}
    </View>
  );
};

// ---------- Main screen ----------
export default function Chat() {
  // UI-only state (stays local)
  const [view, setView] = useState("model"); // "model" | "chat"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [busy, setBusy] = useState(false);

  // NEW: status bar / notch height, used to position the logo and the card
  const insets = useSafeAreaInsets();

  // Data state (lives in Redux) + actions (API calls live in the hook)
  const { chats, activeChatId, messages, isSending } = useSelector((s) => s.chat);
  const { loadChats, openChat, newChat, renameChat, deleteChat, sendMessage } = useChat();

  // Voice: speak(), mute toggle, and `speaking` (true while audio plays)
  const { speak, toggleMute, muted, speaking } = useSpeech();

  // AI limit: `limit.active` is true while every AI model is out of quota
  const limit = useLimit();

  const scrollRef = useRef(null);
  const slide = useRef(new Animated.Value(SIDEBAR_HIDDEN)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Newest Krishna reply: shown as a caption over the image in "model" view
  const lastReply = useMemo(
    () => [...messages].reverse().find((m) => m.sender === "Krishna"),
    [messages]
  );

  // Load sidebar history once when the screen opens
  useEffect(() => {
    loadChats();
  }, []);

  // Know when the keyboard is up, so the Navbar can hide while typing
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

  // Auto-scroll to the newest message
  useEffect(() => {
    if (view === "chat") {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages, view, isSending, keyboardOpen]);

  // Slide the sidebar in/out
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: sidebarOpen ? 0 : SIDEBAR_HIDDEN,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: sidebarOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sidebarOpen]);

  // Gentle breathing pulse on Krishna's image while his voice is playing
  useEffect(() => {
    if (!speaking) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop(); // cleanup stops the animation when speaking ends
  }, [speaking]);

  const toggleView = () => {
    setSidebarOpen(false);
    setView((v) => (v === "model" ? "chat" : "model"));
  };

  const handleNewChat = () => {
    newChat();
    setSidebarOpen(false);
    setView("chat");
  };

  const handleOpenChat = (id) => {
    openChat(id);
    setSidebarOpen(false);
    setView("chat");
  };

  // One send function: send -> wait for Krishna's reply -> speak it.
  // sendMessage (in useChat) returns Krishna's message, { limited: true, resetsAt } when
  // every AI model is out of quota, or null if it failed.
  const send = async () => {
    const text = input.trim();
    if (!text || isSending || limit.active) return;
    setInput("");
    const reply = await sendMessage(text);
    if (reply?.limited) {
      limit.setResetsAt(reply.resetsAt); // shows the banner and locks the input
      setInput(text); // give the typed text back
      return;
    }
    if (reply) speak(reply);
  };

  const toggleMic = () => {
    // TODO: hook up the phone's speech-to-text here
    setListening((l) => !l);
  };

  const startRename = () => {
    setRenameText(sheet.chat.title);
    setSheet({ ...sheet, mode: "rename" });
  };

  const saveRename = async () => {
    const title = renameText.trim();
    if (!title) return;
    if (title === sheet.chat.title) return setSheet(null);
    setBusy(true);
    const ok = await renameChat(sheet.chat._id, title);
    setBusy(false);
    if (ok) setSheet(null); // on failure the hook shows an alert and the box stays open
  };

  const confirmDelete = async () => {
    setBusy(true);
    await deleteChat(sheet.chat._id); // also clears the open chat if it was this one
    setBusy(false);
    setSheet(null);
  };

  // ---------- Views ----------
  const ModelView = (
    <View className="flex-1 rounded-3xl border-2 border-white p-1.5">
      <View className="flex-1 rounded-2xl overflow-hidden">
        {/* explicit size: without it a local image can render at its natural size and overflow */}
        <Animated.Image
          source={KRISHNA_IMG}
          resizeMode="cover"
          style={{ width: "100%", height: "100%", transform: [{ scale: pulse }] }}
        />

        {/* speaker / mute button */}
        <View className="absolute top-3 left-3">
          <OverlayBtn onPress={toggleMute}>
            <Ionicons name={muted ? "volume-mute" : "volume-high"} size={20} color={GOLD} />
          </OverlayBtn>
        </View>

        <View className="absolute top-3 right-3">
          <OverlayBtn onPress={toggleView}>
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
          </OverlayBtn>
        </View>

        {/* Caption: Krishna's latest reply, so the demo works without leaving this view */}
        <View
          className="absolute left-3 right-3 bottom-3 rounded-2xl p-3"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
          {isSending ? (
            <Text className="text-sm italic" style={{ color: GOLD }}>
              Krishna is reflecting...
            </Text>
          ) : lastReply ? (
            <>
              <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator={false}>
                <Text className="text-white text-base leading-6">{lastReply.content}</Text>
              </ScrollView>
            </>
          ) : (
            <Text className="text-white/80 text-sm text-center">
              Speak your heart. Krishna is listening.
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const ChatView = (
    <View
      className="flex-1 rounded-3xl border-2 border-white overflow-hidden"
      style={{ backgroundColor: "rgba(3,6,12,0.92)" }}
    >
      {/* Card header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <IconBtn onPress={() => setSidebarOpen(true)}>
          <Feather name="menu" size={20} color="#fff" />
        </IconBtn>
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <IconBtn onPress={toggleMute}>
            <Ionicons
              name={muted ? "volume-mute" : "volume-high"}
              size={22}
              color={muted ? "#fff" : GOLD}
            />
          </IconBtn>
          <IconBtn onPress={handleNewChat}>
            <Feather name="edit" size={20} color="#fff" />
          </IconBtn>
          <IconBtn onPress={toggleView}>
            <Ionicons name="swap-horizontal" size={22} color="#fff" />
          </IconBtn>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !isSending ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base" style={{ color: GOLD }}>
              Speak your heart. Krishna is listening.
            </Text>
          </View>
        ) : (
          messages.map((m) => <Message key={m._id} item={m} onSpeak={speak} />)
        )}

        {isSending && (
          <Text className="text-xs italic mb-2" style={{ color: GOLD }}>
            Krishna is reflecting...
          </Text>
        )}
      </ScrollView>
    </View>
  );

  const Sidebar = (
    <>
      {/* Dim backdrop: tap to close */}
      <Animated.View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          opacity: fade,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setSidebarOpen(false)} />
      </Animated.View>

      {/* Sidebar panel (inline styles so the border never depends on className on Animated) */}
      <Animated.View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: SIDEBAR_W,
          backgroundColor: "#03060C",
          borderWidth: 2,
          borderColor: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          transform: [{ translateX: slide }],
          // 0 when fully closed, visible as soon as it starts opening
          opacity: fade.interpolate({
            inputRange: [0, 0.05, 1],
            outputRange: [0, 1, 1],
          }),
        }}
      >
        <View className="px-4 pt-4">
          <IconBtn onPress={() => setSidebarOpen(false)} className="self-start">
            <Feather name="menu" size={20} color="#fff" />
          </IconBtn>

          <Pressable
            onPress={handleNewChat}
            className="flex-row items-center mt-5 pb-3 border-b border-white/30"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, gap: 10 })}
          >
            <Feather name="edit" size={20} color="#fff" />
            <Text className="text-white text-base">New Chat</Text>
          </Pressable>

          <Text className="text-white/90 text-base text-center mt-4 mb-2">Chat History</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {chats.length === 0 ? (
            <Text className="text-white/50 text-sm text-center mt-4">No conversations yet</Text>
          ) : (
            chats.map((c) => {
              const active = c._id === activeChatId;
              return (
                <Pressable
                  key={c._id}
                  onPress={() => handleOpenChat(c._id)}
                  onLongPress={() => setSheet({ chat: c, mode: "menu" })}
                  delayLongPress={350}
                  className="px-3 py-2.5 rounded-lg"
                  style={({ pressed }) => ({
                    backgroundColor: active
                      ? "rgba(255,215,106,0.12)"
                      : pressed
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                  })}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-sm"
                    style={{ color: active ? GOLD : "rgba(255,255,255,0.85)" }}
                  >
                    {c.title}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </>
  );

  // ---------- Render ----------
  return (
    <ImageBackground
      source={BG}
      resizeMode="cover"
      className="flex-1"
      style={{ backgroundColor: "#03060C" }}
    >
      {/* NEW: small logo pinned to the top-left corner */}
      <Image
        source={LOGO}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 z-10 h-11 w-11"
        resizeMode="contain"
      />

      {/* CHANGED: <Navbar /> removed from the top (it now renders at the bottom) */}

      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        {/* Content area: the sidebar overlays only this area.
            CHANGED: top padding clears the status bar + corner logo */}
        <View className="flex-1 px-4" style={{ paddingTop: insets.top + 52 }}>
          <View className="flex-1">
            {view === "model" ? ModelView : ChatView}
            {view === "chat" && Sidebar}
          </View>
        </View>

        {/* Bottom input bar, shared by model view, chat view and sidebar view.
            CHANGED: always pb-3, since the Navbar below now provides the bottom spacing */}
        <View className="px-4 pt-3 pb-3">
          {limit.active ? (
            // Every AI model is out of quota: the message replaces the input box
            <View className="flex-row items-center justify-center rounded-full border-2 border-white px-5 h-16">
              <Text
                numberOfLines={2}
                className="text-center text-sm"
                style={{ color: GOLD }}
              >
                {limit.label}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center rounded-full border-2 border-white px-5 h-16">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Share your problems with Krishna..."
                placeholderTextColor="rgba(255,255,255,0.75)"
                className="flex-1 text-white text-base"
                returnKeyType="send"
                onSubmitEditing={send}
                blurOnSubmit={false}
                maxLength={4000}
                editable={!isSending}
              />
              <IconBtn onPress={toggleMic} className="mx-3">
                <Ionicons
                  name={listening ? "mic" : "mic-outline"}
                  size={26}
                  color={listening ? GOLD : "#fff"}
                />
              </IconBtn>
              <IconBtn onPress={send}>
                <Ionicons
                  name="send"
                  size={24}
                  color={input.trim() && !isSending ? GOLD : "#fff"}
                />
              </IconBtn>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* MOVED: Navbar now sits at the very bottom, hidden while the keyboard is open */}
      {!keyboardOpen && <Navbar />}

      {/* Long-press sheet: menu -> rename / delete (one Modal, content switches by mode) */}
      <Modal
        visible={!!sheet}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setSheet(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 items-center justify-center px-8 bg-black/70"
            onPress={() => !busy && setSheet(null)}
          >
            {/* inner Pressable swallows taps so touching the card doesn't close it */}
            <Pressable
              onPress={() => {}}
              className="w-full rounded-3xl border-2 border-white p-4"
              style={{ backgroundColor: "#03060C" }}
            >
              {sheet?.mode === "menu" && (
                <>
                  <Text numberOfLines={1} className="text-white/60 text-sm text-center mb-3">
                    {sheet.chat.title}
                  </Text>
                  <Pressable
                    onPress={startRename}
                    className="flex-row items-center h-12 px-3 rounded-xl active:opacity-60"
                    style={{ gap: 12 }}
                  >
                    <Feather name="edit-2" size={20} color="#fff" />
                    <Text className="text-white text-base">Rename</Text>
                  </Pressable>
                  <View className="h-px bg-white/20 my-1" />
                  <Pressable
                    onPress={() => setSheet({ ...sheet, mode: "delete" })}
                    className="flex-row items-center h-12 px-3 rounded-xl active:opacity-60"
                    style={{ gap: 12 }}
                  >
                    <Feather name="trash-2" size={20} color="#ef4444" />
                    <Text className="text-red-500 text-base">Delete</Text>
                  </Pressable>
                </>
              )}

              {sheet?.mode === "rename" && (
                <>
                  <Text className="text-white text-base font-bold mb-3">Rename chat</Text>
                  <TextInput
                    value={renameText}
                    onChangeText={setRenameText}
                    autoFocus
                    selectTextOnFocus
                    maxLength={60}
                    placeholder="Chat name"
                    placeholderTextColor="#8a8a8a"
                    returnKeyType="done"
                    onSubmitEditing={saveRename}
                    className="h-12 rounded-full border border-white/60 px-5 text-white mb-4"
                  />
                  <View className="flex-row justify-end" style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => setSheet(null)}
                      disabled={busy}
                      className="px-5 h-11 rounded-full border border-gray-400 items-center justify-center"
                    >
                      <Text className="text-white font-semibold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={saveRename}
                      disabled={busy || !renameText.trim()}
                      className="px-6 h-11 rounded-full items-center justify-center bg-[#FFD76A]"
                      style={{ opacity: busy || !renameText.trim() ? 0.5 : 1 }}
                    >
                      <Text className="font-bold text-[#03060C]">
                        {busy ? "Saving..." : "Save"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {sheet?.mode === "delete" && (
                <>
                  <Text className="text-white text-base font-bold mb-2">Delete chat?</Text>
                  <Text className="text-red-400 mb-4">
                    "{sheet.chat.title}" will be permanently deleted. This cannot be undone.
                  </Text>
                  <View className="flex-row justify-end" style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => setSheet(null)}
                      disabled={busy}
                      className="px-5 h-11 rounded-full border border-gray-400 items-center justify-center"
                    >
                      <Text className="text-white font-semibold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={confirmDelete}
                      disabled={busy}
                      className="px-6 h-11 rounded-full items-center justify-center bg-red-500"
                      style={{ opacity: busy ? 0.5 : 1 }}
                    >
                      <Text className="font-bold text-white">
                        {busy ? "Deleting..." : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
}