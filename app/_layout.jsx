import Mapbox from "@rnmapbox/maps";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import "@/global.css";
import asyncStoragePersister from "@/storage/persister";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN);

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "RobotoCondensed-Bold": require("../assets/fonts/RobotoCondensed-Bold.ttf"),
    "RobotoCondensed-Regular": require("../assets/fonts/RobotoCondensed-Regular.ttf"),
    "RobotoCondensed-Light": require("../assets/fonts/RobotoCondensed-Light.ttf"),
    "RobotoCondensed-SemiBold": require("../assets/fonts/RobotoCondensed-SemiBold.ttf"),
    "RobotoCondensed-Medium": require("../assets/fonts/RobotoCondensed-Medium.ttf"),
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 20, // 20 minutes - data is fresh for 20 min
        gcTime: 1000 * 60 * 60 * 4, // 4 hours - keep in cache for 4 hours
        refetchInterval: 1000 * 60 * 20, // 20 minutes - refetch every 20 min
        refetchIntervalInBackground: false, // Don't refetch when app is backgrounded
        refetchOnWindowFocus: false, // Don't refetch on focus
        refetchOnReconnect: true, // DO refetch when network reconnects
        retry: (failureCount, error) => {
          if (error?.message?.includes("Network") || error?.code === "NETWORK_ERROR") {
            return failureCount < 3;
          }
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        networkMode: "offlineFirst", // Use cached data when offline
      },
      mutations: {
        retry: 1,
        networkMode: "offlineFirst",
      },
    },
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen
                name="(modals)"
                options={{
                  animation: "slide_from_bottom",
                  presentation: "modal",
                  animationMatchesGesture: true,
                }}
              />
              <Stack.Screen name="(drawer)" />
            </Stack>
          </SafeAreaView>
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
