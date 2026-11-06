// app/Settings.js
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Keyboard } from "react-native"; // CHANGED: added Keyboard
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import useChat from "../src/hooks/useChat";
import useEndSession from "../src/hooks/useEndSession";
import api from "../src/api/client";
import {
  PageShell,
  BackHeader,
  MenuButton,
  ModalCard,
  PillInput,
  StatusText,
  ModalButtons,
} from "../src/components/ProfileUI";

const EMPTY_PW = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function Settings() {
  const userData = useSelector((s) => s.user.userData);
  const chats = useSelector((s) => s.chat.chats);
  const { loadChats, clearAllChats } = useChat();
  const endSession = useEndSession();

  const [modal, setModal] = useState(null); // null | 'password' | 'clear' | 'delete'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [pw, setPw] = useState(EMPTY_PW);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteText, setDeleteText] = useState("");

  // needed so "Clear Chat History" knows whether there is anything to clear
  useEffect(() => {
    loadChats();
  }, []);

  const openModal = (name) => {
    setStatus({ type: "", text: "" });
    setPw(EMPTY_PW);
    setDeletePassword("");
    setDeleteText("");
    setModal(name);
  };
  const closeModal = () => setModal(null);

  const errorText = (e) => e?.response?.data?.message || "Something went wrong. Please try again.";

  const handlePassword = async () => {
    try {
      setLoading(true);
      const { data } = await api.patch("/user/change-password", pw);
      setStatus({ type: "success", text: data.message });
      setPw(EMPTY_PW);
    } catch (e) {
      setStatus({ type: "error", text: errorText(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    const ok = await clearAllChats(); // DELETE /chat, then empties the sidebar in Redux
    setLoading(false);
    if (ok) closeModal(); // on failure the hook shows an alert and the modal stays open
  };

  // CHANGED: the server call and the local logout are now separate steps
  const handleDelete = async () => {
    // Step 1: delete the account on the server. Only THIS can show a "delete failed" error.
    try {
      setLoading(true);
      // axios.delete sends a body through the config's `data` key
      await api.delete("/user/account", { data: { password: deletePassword } });
    } catch (e) {
      setStatus({ type: "error", text: errorText(e) });
      setLoading(false);
      return; // account still exists, so stay on the modal
    }

    // Step 2: the account is gone. Close the modal BEFORE logging out so it can't
    // linger on screen when Stack.Protected removes this page.
    Keyboard.dismiss();
    setLoading(false);
    closeModal();
    await endSession(); // clears token + Redux, which sends the user to a public screen
  };

  const deleteReady = userData?.hasPassword ? deletePassword.length > 0 : deleteText === "DELETE";

  return (
    <PageShell>
      <ScrollView contentContainerClassName="flex-grow p-4">
        <View className="flex-1 rounded-3xl border-2 border-gray-300 p-4 bg-black/40">
          <BackHeader title="Settings" />

          {/* Language */}
          <Text className="text-gray-400 text-sm mb-2">Language</Text>
          <MenuButton
            label="English"
            chevron
            onPress={() => {
              // TODO: open a language picker when you add more languages
            }}
            icon={<MaterialCommunityIcons name="translate" size={20} color="#fff" />}
          />

          {/* Security */}
          <Text className="text-gray-400 text-sm mt-4 mb-2">Security</Text>

          {/* Change Password (not for Google-signed-in accounts) */}
          {userData?.hasPassword && (
            <MenuButton
              label="Change Password"
              onPress={() => openModal("password")}
              icon={<MaterialCommunityIcons name="key-variant" size={20} color="#fff" />}
            />
          )}

          <MenuButton
            label="Clear Chat History"
            disabled={chats.length === 0}
            onPress={() => openModal("clear")}
            icon={<MaterialCommunityIcons name="chat-remove-outline" size={20} color="#fff" />}
          />

          <MenuButton
            danger
            label="Delete Account"
            onPress={() => openModal("delete")}
            icon={<Ionicons name="trash" size={20} color="#ef4444" />}
          />
        </View>
      </ScrollView>

      {/* Change Password */}
      {modal === "password" && (
        <ModalCard title="Change Password" onClose={closeModal}>
          <PillInput placeholder="Current password" secureTextEntry value={pw.currentPassword}
            onChangeText={(t) => setPw((p) => ({ ...p, currentPassword: t }))} />
          <PillInput placeholder="New password (min 8 characters)" secureTextEntry value={pw.newPassword}
            onChangeText={(t) => setPw((p) => ({ ...p, newPassword: t }))} />
          <PillInput placeholder="Confirm new password" secureTextEntry value={pw.confirmPassword}
            onChangeText={(t) => setPw((p) => ({ ...p, confirmPassword: t }))} />
          <StatusText status={status} />
          <ModalButtons onClose={closeModal} onSubmit={handlePassword} loading={loading} label="Update" closeLabel="Close" />
        </ModalCard>
      )}

      {/* Clear Chat History */}
      {modal === "clear" && (
        <ModalCard title="Clear Chat History" onClose={closeModal}>
          <Text className="text-red-400 font-medium mb-4">
            All your conversations with Krishna will be deleted. This cannot be undone.
          </Text>
          <StatusText status={status} />
          <ModalButtons onClose={closeModal} onSubmit={handleClear} loading={loading} label="Clear" closeLabel="Close" />
        </ModalCard>
      )}

      {/* Delete Account */}
      {modal === "delete" && (
        <ModalCard title="Delete Account" onClose={closeModal}>
          <Text className="text-red-400 font-medium mb-4">
            This permanently deletes your account and cannot be undone.
          </Text>
          {userData?.hasPassword ? (
            <PillInput placeholder="Enter your password to confirm" secureTextEntry value={deletePassword}
              onChangeText={setDeletePassword} />
          ) : (
            <PillInput placeholder="Type DELETE to confirm" value={deleteText} onChangeText={setDeleteText} />
          )}
          <StatusText status={status} />
          <ModalButtons danger onClose={closeModal} onSubmit={handleDelete} loading={loading} label="Delete" disabled={!deleteReady} />
        </ModalCard>
      )}
    </PageShell>
  );
}