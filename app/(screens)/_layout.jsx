import { Stack } from "expo-router";

const ScreenLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="alert" />
      <Stack.Screen name="location" />
      <Stack.Screen name="notification" />
    </Stack>
  );
};

export default ScreenLayout;
