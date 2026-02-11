import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppInitializer } from '@/components/AppInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { NotificationProvider } from '@/contexts/NotificationContext';

const queryClient = new QueryClient();

// Main entry is (app)/dashboard via index redirect. (tabs) and modal are for direct/deep links only.
export const unstable_settings = {
  anchor: '(app)',
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider value={DefaultTheme}>
                <NotificationProvider>
                  <AppInitializer />
                  <PushNotificationSetup />
                  <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                {/* (tabs) and modal: for direct/deep links only; normal flow is drawer via (app) */}
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <Toasts />
                  <StatusBar style="dark" />
                </NotificationProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
