import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();
const TopTabLayout = withLayoutContext(Navigator);

export default function ReportsTabLayout() {
  return (
    <TopTabLayout
      swipeEnabled={false}
      screenOptions={{
        tabBarActiveTintColor: "#F47C25",
        tabBarInactiveTintColor: "#000",
        tabBarStyle: {
          backgroundColor: "#f3f4f6",
        },
        tabBarIndicatorStyle: {
          backgroundColor: "#F47C25",
          height: 2,
        },
        tabBarLabelStyle: {
          textTransform: "capitalize",
          fontWeight: "600",
        },
      }}
    >
      <TopTabLayout.Screen name="community" options={{ title: "Community", swipeEnabled: false }} />
      <TopTabLayout.Screen name="official" options={{ title: "Official", swipeEnabled: false }} />
    </TopTabLayout>
  );
}
