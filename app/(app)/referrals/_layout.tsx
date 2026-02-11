import { Stack } from 'expo-router';

export default function ReferralsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Partner Companies', showBack: false, animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="[id]" options={{ title: 'Partner Details', showBack: true }} />
    </Stack>
  );
}
