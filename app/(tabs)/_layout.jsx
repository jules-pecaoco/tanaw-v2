import { Tabs } from "expo-router";

const TabLayout = () => {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: "#F47C25",
      headerShown: false,

    }}>
      <Tabs.Screen
        name="radar"
        options={{
          title: "Radar",
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "analytics",
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
