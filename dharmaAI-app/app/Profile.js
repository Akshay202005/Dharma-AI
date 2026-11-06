// app/Profile.js
import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import api from "../src/api/client";
import { setUserData } from "../src/store/userSlice";
import useEndSession from "../src/hooks/useEndSession";
import {
  PageShell,
  MenuButton,
  ModalCard,
  PillInput,
  StatusText,
  ModalButtons,
} from "../src/components/ProfileUI";

export default function Profile() {
  const dispatch = useDispatch();
  const router = useRouter();
  const userData = useSelector((s) => s.user.userData);
  const endSession = useEndSession();

  // Only the Edit Profile modal is left here; the other modals live in Settings
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null); // asset picked from the gallery

  const openEdit = () => {
    setStatus({ type: "", text: "" });
    setFullName(userData?.fullName || "");
    setAvatarFile(null);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const errorText = (e) => e?.response?.data?.message || "Something went wrong. Please try again.";

  const handleLogout = async () => {
    try {
      await api.get("/auth/signout");
    } catch (e) {
      console.log(e?.message); // even if the server call fails, still log out locally
    } finally {
      endSession();
    }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      return setStatus({ type: "error", text: "Image must be under 2 MB." });
    }
    setStatus({ type: "", text: "" });
    setAvatarFile(asset); // only a local preview: nothing is uploaded until Save
  };

  const handleEdit = async () => {
    const trimmed = fullName.trim();
    if (trimmed.length < 2) return setStatus({ type: "error", text: "Name must be at least 2 characters." });
    try {
      setLoading(true);
      const changes = {};

      if (trimmed !== userData.fullName) {
        const { data } = await api.patch("/user/profile", { fullName: trimmed });
        changes.fullName = data.fullName;
      }

      if (avatarFile) {
        const form = new FormData();
        // the field name "avatar" must match upload.single("avatar") on the server
        form.append("avatar", {
          uri: avatarFile.uri,
          name: avatarFile.fileName || "avatar.jpg",
          type: avatarFile.mimeType || "image/jpeg",
        });
        const { data } = await api.patch("/user/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        changes.avatar = data.avatar;
      }

      // server returns only the changed fields, so merge them into the existing user
      if (Object.keys(changes).length) dispatch(setUserData({ ...userData, ...changes }));
      closeEdit();
    } catch (e) {
      setStatus({ type: "error", text: errorText(e) });
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = avatarFile?.uri || userData?.avatar?.url;
  const hasRealAvatar = avatarUrl && !avatarUrl.includes("placehold.co");

  return (
    <PageShell>
      <ScrollView contentContainerClassName="flex-grow p-4">
        {/* Outer card fills the screen height (flex-1), like the design */}
        <View className="flex-1 rounded-3xl border-2 border-gray-300 p-4 bg-black/40">
          <Text className="text-white text-lg font-bold mb-3">Profile</Text>

          {/* Inner card */}
          <View className="rounded-3xl border-2 border-gray-400 p-4">
            {/* Avatar, name and email, stacked and centered (Phone removed) */}
            <View className="items-center">
              {hasRealAvatar ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-16 h-16 rounded-full border-2 border-[#A87A22]"
                />
              ) : (
                <Ionicons name="person-circle" size={68} color="#fff" />
              )}
              <Text className="text-white font-bold text-base mt-2" numberOfLines={1}>
                {userData?.fullName || "Name"}
              </Text>
              <Text className="text-gray-400 font-semibold text-sm mt-1" numberOfLines={1}>
                {userData?.email || "Email"}
              </Text>
            </View>

            <View className="h-px bg-gray-400 my-5" />

            <MenuButton
              label="Edit Profile"
              chevron
              onPress={openEdit}
              icon={<MaterialCommunityIcons name="pencil" size={20} color="#fff" />}
            />
            <MenuButton
              label="Settings"
              chevron
              onPress={() => router.push("/Settings")}
              icon={<Ionicons name="settings-sharp" size={20} color="#fff" />}
            />
            <MenuButton
              label="Help"
              chevron
              onPress={() => router.push("/Help")}
              icon={<Ionicons name="help-circle" size={22} color="#fff" />}
            />
            <MenuButton
              danger
              label="Log Out"
              onPress={handleLogout}
              icon={<Ionicons name="log-out-outline" size={22} color="#ef4444" />}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile modal: unchanged */}
      {editOpen && (
        <ModalCard title="Edit Profile" onClose={closeEdit}>
          <Pressable onPress={pickAvatar} className="items-center mb-4">
            {hasRealAvatar ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-20 h-20 rounded-full border-2 border-[#A87A22]"
              />
            ) : (
              <Ionicons name="person-circle" size={80} color="#fff" />
            )}
            <Text className="text-[#FFD76A] text-xs mt-1 underline">Change photo</Text>
          </Pressable>
          <PillInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            maxLength={80}
            autoCapitalize="words"
          />
          <PillInput
            value={userData?.email || ""}
            editable={false}
            className="h-12 rounded-full border border-white/30 px-5 text-white/60 mb-3"
          />
          <StatusText status={status} />
          <ModalButtons onClose={closeEdit} onSubmit={handleEdit} loading={loading} label="Save" />
        </ModalCard>
      )}
    </PageShell>
  );
}