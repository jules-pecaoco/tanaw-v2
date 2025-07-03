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
          backgroundColor: "#f3f4f6",
        },
        tabBarIndicatorStyle: {
          backgroundColor: "#F47C25",
          height: 3,
          width: "50%",
        },
        tabBarLabelStyle: {
          textTransform: "capitalize",
        },
      }}
    >
      <TopTabLayout.Screen name="community" options={{ title: "Community" }} />
      <TopTabLayout.Screen name="official" options={{ title: "Official" }} />
    </TopTabLayout>
  );
}
