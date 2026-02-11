import { Stack } from 'expo-router';

export default function SuggestionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Suggestions', showBack: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Suggestion Details', showBack: true }} />
    </Stack>
  );
}
