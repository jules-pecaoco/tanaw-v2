import { Stack } from "expo-router";

const ModalsLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#f3f4f6" },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="alert" />
      <Stack.Screen name="report" />
      <Stack.Screen
        name="searchlocation"
        options={{
          title: "Search Location",
        }}
      />
    </Stack>
  );
};

export default ModalsLayout;
