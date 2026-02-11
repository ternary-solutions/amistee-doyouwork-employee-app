import { Stack } from 'expo-router';

export default function SuggestionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Suggestions' }} />
      <Stack.Screen name="[id]" options={{ title: 'Suggestion Details' }} />
    </Stack>
  );
}
