import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();
const TopTabLayout = withLayoutContext(Navigator);



export default function ReportsTabLayout() {
  return (
    <TopTabLayout
      screenOptions={{
        tabBarActiveTintColor: "#F47C25",
        tabBarInactiveTintColor: "#000",
        tabBarStyle: {
          backgroundColor: "#fffcfa",
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
