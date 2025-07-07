import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerActions } from "@react-navigation/native";
import { router, Tabs, useNavigation } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import BouncingButton from "../../../ui/components/BouncingButton";

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
        tabBarActiveTintColor: "#F47C25",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#fffcfa",
          borderTopWidth: 0.5,
          borderTopColor: "#232533",
          height: 75,
        },
        tabBarButton: (props) => <BouncingButton {...props} android_ripple="transparent" />,

        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#fffcfa",
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
        },

        headerLeft: () => (
          <View className="flex-row items-center ml-5 mb-3">
            <BouncingButton onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} android_ripple={{ color: "#f47c25", borderless: true }}>
              <Ionicons name="menu" size={30} color="#1f2937" />
            </BouncingButton>
          </View>
        ),
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="radar"
        options={{
          headerTitle: () => (
            <View className="flex-row items-center mb-3">
              <TouchableOpacity onPress={() => router.navigate("search")}>
                <View className="flex-row items-center">
                  <Ionicons name="search" size={24} color="#1f2937" />
                  <Text className="mx-2 text-xl font-tmedium">Bacolod, PH</Text>
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
            <View className="flex-row items-center mb-3">
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
            <View className="flex-row items-center mb-3">
              <TouchableOpacity onPress={() => router.navigate("search")}>
                <View className="flex-row items-center">
                  <Ionicons name="search" size={24} color="#1f2937" />
                  <Text className="mx-2 text-xl font-tmedium">Bacolod, PH</Text>
                  <Ionicons name="chevron-down" size={16} color="#1f2937" />
                </View>
              </TouchableOpacity>
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
