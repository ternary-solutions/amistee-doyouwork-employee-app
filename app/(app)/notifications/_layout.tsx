import { Stack } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Notifications', showBack: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Notification', showBack: true }} />
    </Stack>
  );
}
