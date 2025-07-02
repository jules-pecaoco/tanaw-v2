import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const TabIcon = ({ iconName, iconFilled, color, focused, name }) => {
  return (
    <View className={`items-center w-24 h-24 mt-20`}>
      <View className={`${focused ? "bg-orange-100" : ""}  px-6 py-1 rounded-full`}>
        <Ionicons name={focused ? iconFilled : iconName} size={24} color={color} />
      </View>
      <Text className={`${focused ? "font-tsemibold" : "font-tregular"} text-xs`} style={{ color: color }}>
        {name}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: "#F47C25",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#f3f4f6",
          borderTopWidth: 0.5,
          borderTopColor: "#232533",
          height: 75,
        },
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={0.5} />,
      }}
    >
      <Tabs.Screen
        name="radar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="compass-outline" iconFilled="compass" color={color} name="Radar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center w-24 h-24 mt-20">
              <View className={`${focused ? "bg-orange-100" : ""} px-6 py-1 rounded-full`}>
                <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={24} color={color} />
              </View>
              <Text className={`${focused ? "font-tsemibold" : "font-tregular"} text-xs`} style={{ color: color }}>
                Reports
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="bar-chart-outline" iconFilled="bar-chart" color={color} name="Analytics" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
