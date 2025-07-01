import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import asyncStoragePersister from "@/storage/persister";

import "@/global.css";

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
        gcTime: 1000 * 60 * 60 * 4, // 4 hours - keep in cache for 6 hours
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
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(screens)" />
          </Stack>
        </SafeAreaView>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

export default RootLayout;
