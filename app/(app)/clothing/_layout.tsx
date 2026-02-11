import { Stack } from 'expo-router';

export default function ClothingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Clothing Requests' }} />
      <Stack.Screen name="[id]" options={{ title: 'Clothing Request Details' }} />
    </Stack>
  );
}
