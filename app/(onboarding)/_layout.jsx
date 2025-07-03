import { Stack } from "expo-router";

const OnBoardingLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationDuration: 800,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="location" />
      <Stack.Screen name="notification" />
    </Stack>
  );
};

export default OnBoardingLayout;
