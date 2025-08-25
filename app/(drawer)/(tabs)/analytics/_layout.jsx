import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();
const TopTabLayout = withLayoutContext(Navigator);

export default function AnalyticsTabLayout() {
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
      <TopTabLayout.Screen name="forecast" options={{ title: "Forecast", swipeEnabled: false }} />
      <TopTabLayout.Screen name="analytic" options={{ title: "Analytics", swipeEnabled: false }} />
    </TopTabLayout>
  );
}
