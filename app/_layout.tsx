import { Toasts } from "@backpackapp-io/react-native-toast";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppInitializer } from "@/components/AppInitializer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { HeaderOptionsProvider } from "@/contexts/HeaderOptionsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://2227cb9ee6c27b046faee8ca5b9e8b6e@o4510673004527616.ingest.us.sentry.io/4510869750743040",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const queryClient = new QueryClient();

// Main entry is (app)/dashboard via index redirect. (tabs) and modal are for direct/deep links only.
export const unstable_settings = {
  anchor: "(app)",
};

export default Sentry.wrap(function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
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
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
});
