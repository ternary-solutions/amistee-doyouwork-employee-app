import { Stack } from 'expo-router';

export default function SpiffsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Spiffs', showBack: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Spiff Details', showBack: true }} />
    </Stack>
  );
}
