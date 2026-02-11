import { Stack } from 'expo-router';

export default function ReferralsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Partner Companies' }} />
      <Stack.Screen name="[id]" options={{ title: 'Partner Details' }} />
    </Stack>
  );
}
