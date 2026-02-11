import { Toasts } from "@backpackapp-io/react-native-toast";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppInitializer } from "@/components/AppInitializer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { HeaderOptionsProvider } from "@/contexts/HeaderOptionsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const queryClient = new QueryClient();

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

// On web, expo-file-system isn't available. Use AsyncStorage (uses localStorage on web).
const posthogOptions = {
  host: posthogHost,
  ...(Platform.OS === "web"
    ? {
        customStorage: {
          getItem: (key: string) => AsyncStorage.getItem(key),
          setItem: (key: string, value: string) =>
            AsyncStorage.setItem(key, value),
        },
      }
    : {}),
  ...(__DEV__ ? { debug: true } : {}),
};

// Main entry is (app)/dashboard via index redirect. (tabs) and modal are for direct/deep links only.
export const unstable_settings = {
  anchor: "(app)",
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PostHogProvider apiKey={posthogApiKey} options={posthogOptions}>
            <BottomSheetModalProvider>
              <QueryClientProvider client={queryClient}>
                <ThemeProvider value={DefaultTheme}>
                  <HeaderOptionsProvider>
                    <NotificationProvider>
                      <AppInitializer />
                      <PushNotificationSetup />
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(app)" />
                        {/* (tabs) and modal: for direct/deep links only; normal flow is drawer via (app) */}
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen
                          name="modal"
                          options={{ presentation: "modal", title: "Modal" }}
                        />
                      </Stack>
                      <Toasts />
                      <StatusBar style="dark" />
                    </NotificationProvider>
                  </HeaderOptionsProvider>
                </ThemeProvider>
              </QueryClientProvider>
            </BottomSheetModalProvider>
          </PostHogProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
