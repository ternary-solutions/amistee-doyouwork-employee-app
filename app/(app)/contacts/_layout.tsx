import { stackScreenOptionsWithAppHeader } from '@/utils/stackScreenOptionsWithAppHeader';
import { Stack } from 'expo-router';

export default function ContactsLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithAppHeader()}>
      <Stack.Screen name="index" options={{ title: 'Contacts' }} />
      <Stack.Screen name="[id]" options={{ title: 'Contact' }} />
    </Stack>
  );
}
