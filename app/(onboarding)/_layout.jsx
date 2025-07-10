import { Stack } from "expo-router";

const OnBoardingLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="hero" />
      <Stack.Screen name="location" />
      <Stack.Screen name="notification" />
    </Stack>
  );
};

export default OnBoardingLayout;
