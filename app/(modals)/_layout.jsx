import { Stack } from "expo-router";

const ModalsLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#fffcfa" },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="alert"
        options={{
          title: "Alert",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="report"
        options={{
          title: "Report",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search Location",
        }}
      />
    </Stack>
  );
};

export default ModalsLayout;
