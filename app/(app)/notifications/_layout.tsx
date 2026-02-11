import { stackScreenOptionsWithAppHeader } from '@/utils/stackScreenOptionsWithAppHeader';
import { Stack } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithAppHeader()}>
      <Stack.Screen name="index" options={{ title: 'Notifications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Notification' }} />
    </Stack>
  );
}
