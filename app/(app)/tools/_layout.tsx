import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Tools', showBack: false }} />
      <Stack.Screen name="catalog" options={{ title: 'Tool Catalog', showBack: true }} />
    </Stack>
  );
}
