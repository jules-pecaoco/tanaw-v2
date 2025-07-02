import { Stack } from "expo-router";

const ScreenLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="alert" />
      <Stack.Screen name="location" />
    </Stack>
  );
};

export default ScreenLayout;
