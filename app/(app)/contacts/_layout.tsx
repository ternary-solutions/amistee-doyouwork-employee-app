import { Stack } from 'expo-router';

export default function ContactsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Contacts', showBack: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Contact', showBack: true }} />
    </Stack>
  );
}
