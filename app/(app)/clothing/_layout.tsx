import { Stack } from 'expo-router';

export default function ClothingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Clothing Requests', showBack: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Clothing Request Details', showBack: true }} />
    </Stack>
  );
}
