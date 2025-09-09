import { SafeAreaView, ScrollView, Text, View } from "react-native";

// Data is separated from the component for easy updates.
const faqData = [
  {
    title: "About Tanaw",
    data: [
      {
        question: "What is the purpose of Tanaw?",
        answer:
          "Tanaw is a user-friendly platform designed to address the critical issues of climate change in the Negros Island Region. Its purpose is to empower communities and authorities with real-time, localized information on climate risks like heat waves and floods, enabling informed decisions for safety, preparedness, and long-term resilience.",
      },
      {
        question: "Who is Tanaw for?",
        answer:
          "Tanaw is designed for three main groups:\n1. The General Public: For planning daily activities and ensuring personal safety.\n2. Emergency Responders: For improving preparation and planning during climate events.\n3. Local Government Authorities & Disaster Planners: For long-term planning, resource allocation, and mitigating vulnerable zones.",
      },
      {
        question: "Where does your data come from?",
        answer:
          "Tanaw aggregates data from multiple trusted sources:\n• Weather Data: From global providers like OpenWeatherMap and RainViewer.\n• Hazard Maps: Based on official data from agencies like Project NOAH.\n• Heat Index Classifications: Based on the official system from PAGASA.\n• Flood Risk Classifications: Adapted from the scheme used by the Philippine Information Agency (PIA).\n• Citizen Reports: Real-time incidents are reported by our community of users.",
      },
    ],
  },
  {
    title: "Map & Layers",
    data: [
      {
        question: "What's the difference between Weather and Hazard layers?",
        answer:
          "Weather layers show what is happening now or in the near future (like rain intensity). They are dynamic and change often. Hazard layers show known, static risks for an area (like flood-prone zones). They represent potential danger if a certain event occurs.",
      },
      {
        question: "The Heat Index layer feels different from the actual temperature. Why?",
        answer:
          "You're right! The layer doesn't show simple air temperature. It shows the Dew Point Temperature (TD2), which is a measure of moisture in the air. This is a much better indicator of the 'feels like' temperature or Heat Index because high humidity makes it harder for your body to cool down, making the heat feel more dangerous.",
      },
    ],
  },
  {
    title: "Hazard Reporting & Notifications",
    data: [
      {
        question: "Why must I submit 3 photos for a hazard report?",
        answer:
          "Submitting three photos is a critical requirement for our AI validation system. It allows the AI to confirm that the hazard is a real-world event (not a picture of a screen), understand the situation from multiple angles, and prevent the spread of misinformation from low-quality or fraudulent reports.",
      },
      {
        question: "What happens after I submit a report?",
        answer:
          "Your report is sent to our AI analysis engine (powered by Google Gemini) for verification. If it's approved as a valid, real-time hazard, an anonymous alert is sent to other Tanaw users within a 5-kilometer radius.",
      },
      {
        question: "Will I get a notification for my own report?",
        answer:
          "No. To avoid unnecessary alerts, the system is designed to exclude the original reporter from the notification list for their own submission.",
      },
    ],
  },
];

// Reusable component for a single Question/Answer pair
const QAPair = ({ question, answer }) => (
  <View className="mb-5">
    <Text className="text-base font-tsemibold text-secondary mb-1.5">{question}</Text>
    <Text className="text-base font-tregular text-gray-600 leading-snug">{answer}</Text>
  </View>
);

// Reusable component for a titled section
const FAQSection = ({ title, children }) => (
  <View className="mb-6 bg-white rounded-xl p-4 shadow-md shadow-black/5">
    <Text className="text-xl font-tsemibold text-primary mb-4 border-b border-gray-200 pb-2">{title}</Text>
    {children}
  </View>
);

const FAQs = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-3xl font-tbold text-secondary text-center mb-6">Tanaw: Guide & FAQs</Text>

        {/* --- Guide Section --- */}
        <FAQSection title="Guide: Understanding Tanaw's Core Features">
          <Text className="text-base font-tregular text-gray-600 leading-snug">
            Welcome to Tanaw! This guide will help you navigate the five central features designed to keep you safe and informed about climate risks
            in the Negros Island Region.
            {"\n\n"}• <Text className="font-tbold">Climate Risk Mapping:</Text> The main map provides real-time visualization of heat and flood risks
            using color-coded overlays.
            {"\n"}• <Text className="font-tbold">Alert and Notification System:</Text> Receive timely, personalized push notifications when risks
            reach a critical threshold in your area.
            {"\n"}• <Text className="font-tbold">Emergency Agency Locator:</Text> Find and get directions to nearby hospitals, fire stations, and
            evacuation centers during an emergency.
            {"\n"}• <Text className="font-tbold">Impact Analytics:</Text> View historical data on heat and flood patterns to help with long-term
            planning and preparedness.
            {"\n"}• <Text className="font-tbold">Community Incident Reporting:</Text> Become an initial reporter by submitting photos of real-time
            hazards to enhance awareness for the entire community.
          </Text>
        </FAQSection>

        {/* --- Mapped FAQ Sections --- */}
        {faqData.map((section) => (
          <FAQSection key={section.title} title={section.title}>
            {section.data.map((item, index) => (
              // Remove bottom margin from the last item in a section
              <View key={item.question} className={index === section.data.length - 1 ? "" : "mb-5"}>
                <Text className="text-base font-tsemibold text-secondary mb-1.5">{item.question}</Text>
                <Text className="text-base font-tregular text-gray-600 leading-snug">{item.answer}</Text>
              </View>
            ))}
          </FAQSection>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQs;
