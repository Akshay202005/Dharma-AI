import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PageShell, BackHeader, MenuButton } from "../src/components/ProfileUI";

export default function Help() {
  const router = useRouter();

  return (
    <PageShell>
      <ScrollView contentContainerClassName="flex-grow p-4">
        <View className="flex-1 rounded-3xl border-2 border-gray-300 p-4 bg-black/40">
          <BackHeader title="Help" />

          <Text className="text-gray-400 text-sm mb-2">Reach out to us</Text>

          <MenuButton
            label="About"
            chevron
            onPress={() => router.push("/About")}
            icon={<Ionicons name="information-circle" size={22} color="#fff" />}
          />
          <MenuButton
            label="Contact Us"
            chevron
            onPress={() => router.push("/Contact")}
            icon={<Ionicons name="call" size={20} color="#fff" />}
          />
        </View>
      </ScrollView>
    </PageShell>
  );
}