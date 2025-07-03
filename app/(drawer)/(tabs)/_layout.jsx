import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerActions } from "@react-navigation/native";
import { router, Tabs, useNavigation } from "expo-router";
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
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: true,
        tabBarActiveTintColor: "#F47C25",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#f3f4f6",
          borderTopWidth: 0.5,
          borderTopColor: "#232533",
          height: 75,
        },
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#f3f4f6",
          elevation: 1,
          shadowOpacity: 0,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={{ marginLeft: 16 }}>
            <Ionicons name="menu" size={28} color="#1f2937" />
          </TouchableOpacity>
        ),
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={0.5} />,
      }}
    >
      <Tabs.Screen
        name="radar"
        options={{
          headerTitle: () => (
            <View className="fl@react-navigation/material-top-tabsex-row items-center">
              <TouchableOpacity onPress={() => router.push("searchlocation")}>
                <View className="flex-row items-center">
                  <Ionicons name="search" size={24} color="#1f2937" />
                  <Text className="mx-2 text-lg font-tsemibold">Bacolod, PH</Text>
                  <Ionicons name="chevron-down" size={16} color="#1f2937" />
                </View>
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="compass-outline" iconFilled="compass" color={color} name="Radar" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          headerTitle: () => (
            <View className="flex-row items-center">
              <Text className="mx-2 text-3xl font-tmedium">Reports</Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="newspaper-outline" iconFilled="newspaper" color={color} name="Reports" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          headerTitle: () => (
            <View className="flex-row items-center">
              <Text className="mx-2 text-3xl font-tmedium">Analytics</Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="bar-chart-outline" iconFilled="bar-chart" color={color} name="Analytics" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
