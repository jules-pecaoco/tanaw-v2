import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, SafeAreaView, ScrollView, Text, View } from "react-native";

const FeatureHighlight = ({ iconName, title, description }) => (
  <View className="flex-row items-start mb-4">
    <Ionicons name={iconName} size={24} className="text-primary mr-4 mt-1" />
    <View className="flex-1">
      <Text className="text-base font-tsemibold text-secondary">{title}</Text>
      <Text className="text-base font-tregular text-gray-600 leading-snug">{description}</Text>
    </View>
  </View>
);

const About = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* App Logo and Name */}
        <View className="items-center mb-6">
          <Image
            source={require("../../assets/images/logo_app.png")} // <-- UPDATE THIS PATH
            className="w-24 h-24 mb-2"
            resizeMode="contain"
          />
          <Text className="text-4xl font-tbold text-secondary">Tanaw</Text>
        </View>

        {/* Mission Statement Section */}
        <View className="mb-8">
          <Text className="text-xl font-tsemibold text-primary mb-3 text-center">Our Mission</Text>
          <Text className="text-base font-tregular text-gray-600 leading-relaxed text-center">
            To empower the communities and authorities of the Negros Island Region with hyper-localized, real-time information on climate risks,
            fostering a future of safety, preparedness, and resilience.
          </Text>
        </View>

        {/* Core Features Section */}
        <View className="mb-8">
          <Text className="text-xl font-tsemibold text-primary mb-4 text-center">Core Features</Text>
          <FeatureHighlight
            iconName="map-outline"
            title="Climate Risk Visualization"
            description="Interactive maps with color-coded overlays for heat index and known hazard zones."
          />
          <FeatureHighlight
            iconName="notifications-outline"
            title="Personalized Alerts"
            description="Receive timely push notifications when climate threats reach critical levels in your area."
          />
          <FeatureHighlight
            iconName="shield-checkmark-outline"
            title="Emergency Agency Locator"
            description="Quickly find and navigate to the nearest hospitals, fire stations, and evacuation sites."
          />
          <FeatureHighlight
            iconName="analytics-outline"
            title="Climate Impact Analytics"
            description="Access historical data and trends to support long-term planning and decision-making."
          />
          <FeatureHighlight
            iconName="people-outline"
            title="Community Hazard Reporting"
            description="Contribute to public safety by reporting real-time incidents with photos and location data."
          />
        </View>

        {/* Development Team Section */}
        <View className="items-center bg-white p-4 rounded-xl shadow-md shadow-black/5">
          <Text className="text-lg font-tsemibold text-secondary mb-2">A Capstone Project By</Text>
          <Text className="text-base font-tmedium text-primary">Mark Angelo C. Navarro</Text>
          <Text className="text-base font-tmedium text-primary">Jules Alfonz R. Pecaoco</Text>
          <Text className="text-sm font-tregular text-gray-500 mt-2">Bachelor of Science in Information Technology</Text>
          <Text className="text-sm font-tregular text-gray-500">University of Negros Occidental – Recoletos</Text>
        </View>

        {/* App Version Footer */}
        <Text className="text-center text-xs font-tregular text-gray-400 mt-8">Version 2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;
