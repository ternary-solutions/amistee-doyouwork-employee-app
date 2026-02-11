import { Stack } from 'expo-router';

export default function SpiffsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Spiffs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Spiff Details' }} />
    </Stack>
  );
}
