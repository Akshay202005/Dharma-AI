import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PageShell, BackHeader } from "../src/components/ProfileUI";

// Android needs this flag for LayoutAnimation (safe no-op elsewhere)
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimentalAndroid?.(true);
}

// Content lives in data, so the JSX below stays small and easy to edit
const SECTIONS = [
  {
    id: "what",
    title: "What is Dharma AI?",
    body: "Dharma AI is an AI-driven emotional guidance platform inspired by the timeless wisdom of the Bhagavad Gita and the stories of the Mahabharata. It provides a space where users can share their thoughts, emotions, and challenges while receiving AI-generated guidance inspired by the teachings, values, and experiences represented in these traditions.",
  },
  {
    id: "mission",
    title: "Our Mission",
    body: "Our mission is to bridge ancient wisdom with modern artificial intelligence, helping people navigate fear, self-doubt, difficult decisions, stress, and everyday life challenges with greater clarity, perspective, and inner balance. Dharma AI encourages thoughtful reflection while making timeless wisdom more accessible in today's digital world.",
  },
  {
    id: "how",
    title: "How It Works",
    steps: [
      {
        title: "1. Share Your Thoughts",
        text: "Describe your situation, question, or challenge through a natural conversation.",
      },
      {
        title: "2. AI Understands the Context",
        text: "Dharma AI analyzes your message to understand the emotions, intent, and context of your concern.",
      },
      {
        title: "3. Receive Thoughtful Guidance",
        text: "The system generates guidance inspired by relevant teachings and stories from the Bhagavad Gita and Mahabharata, encouraging reflection and informed decision-making.",
      },
    ],
  },
];

const DISCLAIMER =
  "Dharma AI is designed for reflection and personal guidance. It is not a substitute for professional medical, psychological, legal, or financial advice.";

// One collapsible row: tap the heading to show/hide its content (unchanged)
const AccordionItem = ({ section, isOpen, onToggle }) => (
  <View className="border-b border-[#2A2D35]">
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between py-4"
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
    >
      <Text className="text-white text-xl font-bold flex-1 pr-3">{section.title}</Text>
      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#FFD76A" />
    </Pressable>

    {isOpen && (
      <View className="pb-4">
        {section.body && (
          <Text className="text-gray-300 text-base leading-6">{section.body}</Text>
        )}

        {section.steps &&
          section.steps.map((step) => (
            <View key={step.title} className="mb-3">
              <Text className="text-[#FFD76A] text-base font-semibold">{step.title}</Text>
              <Text className="text-gray-300 text-base leading-6">{step.text}</Text>
            </View>
          ))}
      </View>
    )}
  </View>
);

const About = () => {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    // CHANGED: PageShell now provides the background, corner logo and bottom Navbar
    <PageShell>
      <ScrollView
        contentContainerClassName="flex-grow p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* justify-between keeps the disclaimer pinned to the bottom of the card */}
        <View className="flex-1 justify-between rounded-3xl border-2 border-[#6D6C6C] bg-[#03060C] p-5">
          <View>
            {/* CHANGED: back arrow + centered title, no divider (as in your image) */}
            <BackHeader title="About Dharma AI" divider={false} />

            <Text className="mb-6 text-center text-base leading-6 text-white">
              Bridging ancient wisdom and modern AI to support thoughtful
              decision-making and self-reflection.
            </Text>

            {SECTIONS.map((section) => (
              <AccordionItem
                key={section.id}
                section={section}
                isOpen={openId === section.id}
                onToggle={() => toggle(section.id)}
              />
            ))}
          </View>

          <Text className="mt-10 text-center text-[10px] leading-4 text-gray-400">
            {DISCLAIMER}
          </Text>
        </View>
      </ScrollView>
    </PageShell>
  );
};

export default About;