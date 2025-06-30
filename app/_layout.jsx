import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "@/global.css";

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="index"></Stack.Screen>
        <Stack.Screen name="(tabs)"></Stack.Screen>
        <Stack.Screen name="(screens)"></Stack.Screen>
      </Stack>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
