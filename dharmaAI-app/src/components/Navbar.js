// src/components/Navbar.js
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const GOLD = "#FFD76A";

// Pages that belong to the Profile tab, so the tab stays lit on them
const PROFILE_PAGES = ["/Profile", "/Settings", "/Help", "/About", "/Contact"];

// protected: true -> only logged-in users may open it (matches Stack.Protected in _layout.jsx)
const TABS = [
    {
        key: "home",
        href: "/Home",
        match: (p) => p === "/" || p === "/Home",
        icon: (active) => (active ? "home" : "home-outline"),
    },
    {
        key: "chat",
        href: "/Chat",
        protected: true,
        match: (p) => p === "/Chat",
        icon: (active) => (active ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"),
    },
    {
        key: "profile",
        href: "/Profile",
        protected: true,
        match: (p) => PROFILE_PAGES.includes(p),
        icon: () => "person-circle", // filled in both states, only the color changes
    },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const isAuthenticated = useSelector((s) => s.user.isAuthenticated);

    const goTo = (href, isProtected) => {
        // Guest tapping a protected tab -> send to the sign-in page instead
        if (isProtected && !isAuthenticated) {
            router.push("/signin");
            return;
        }
        if (pathname !== href) router.push(href);
    };

    return (
        <View
            style={{ marginBottom: insets.bottom + 8 }}
            className="mx-3 h-14 flex-row items-center justify-around rounded-full border border-[#A87A22] bg-[#03060C]/80 px-4"
        >
            {TABS.map((tab) => {
                const active = tab.match(pathname);
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => goTo(tab.href, tab.protected)}
                        hitSlop={10}
                        className="h-full flex-1 items-center justify-center active:opacity-60"
                    >
                        <Ionicons
                            name={tab.icon(active)}
                            size={tab.key === "profile" ? 30 : 26}
                            color={active ? GOLD : "#fff"}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}