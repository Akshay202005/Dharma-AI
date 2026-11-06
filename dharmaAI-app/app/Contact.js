// app/Contact.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import api from "../src/api/client";
import { PageShell, BackHeader } from "../src/components/ProfileUI";

// Reusable label + pill input row (unchanged)
const Field = ({ label, ...inputProps }) => (
  <View className="flex-row items-center mb-5">
    <Text className="text-white text-sm w-28">{label}</Text>
    <TextInput
      className="flex-1 h-12 rounded-full border-2 border-white px-5 text-white text-base"
      placeholderTextColor="#6b7280"
      {...inputProps}
    />
  </View>
);

export default function Contact() {
  // Pre-fill name/email for signed-in users (same as the website)
  const userData = useSelector((s) => s.user.userData);

  const [form, setForm] = useState({
    name: userData?.fullName || "",
    email: userData?.email || "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const setField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // handleSubmit is unchanged
  const handleSubmit = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    // Same rules as contact.models.js, so users get instant feedback
    if (!name || !email || !message) {
      return Alert.alert("Missing details", "Name, email and message are required.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Alert.alert("Invalid email", "Please enter a valid email address.");
    }
    if (message.length < 10) {
      return Alert.alert("Message too short", "Please write at least 10 characters.");
    }

    try {
      setLoading(true);

      // api attaches the saved token (if any), so signed-in users get linked
      const { data } = await api.post("/contact", { name, email, subject, message });

      Alert.alert("Message sent", data?.message || "Thank you! We'll get back to you soon.");
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      // axios puts the server's reply on err.response, not on err itself
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        (status === 429
          ? "Too many messages. Please try again later."
          : err.message === "Network Error"
          ? "Can't reach the server. Check your connection."
          : "Something went wrong");
      Alert.alert("Could not send", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CHANGED: PageShell replaces ImageBackground + SafeAreaView + top Navbar
    <PageShell>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow p-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 rounded-3xl border-2 border-gray-500 bg-black/70 px-5 py-6">
            {/* CHANGED: back arrow + centered title, no divider */}
            <BackHeader title="Get in Touch" divider={false} />

            <Text className="text-white text-sm text-center mb-6">
              Have a question, suggestion, or feedback?{"\n"}We'd love to hear
              from you.
            </Text>

            <Field
              label="Full Name"
              value={form.name}
              onChangeText={setField("name")}
              autoCapitalize="words"
              maxLength={80}
            />
            <Field
              label="Email Address"
              value={form.email}
              onChangeText={setField("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Field
              label="Subject"
              value={form.subject}
              onChangeText={setField("subject")}
              maxLength={120}
            />

            <Text className="text-white text-sm mt-2 mb-3">Your Message</Text>
            {/* CHANGED: h-56 -> h-44 so the whole form fits above the bottom Navbar */}
            <TextInput
              className="h-44 rounded-3xl border-2 border-white px-5 py-4 text-white text-base"
              placeholder="Write your message here..."
              placeholderTextColor="#6b7280"
              multiline
              textAlignVertical="top"
              maxLength={3000}
              value={form.message}
              onChangeText={setField("message")}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="self-center mt-6 flex-row items-center rounded-full border-2 border-[#A87A22] px-8 py-3.5 active:opacity-70"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <Text className="text-[#FFD76A] text-base font-semibold mr-4">
                {loading ? "Sending..." : "Send Message"}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#FFD76A" />
              ) : (
                <Feather name="arrow-right-circle" size={24} color="#FFD76A" />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageShell>
  );
}