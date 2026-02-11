import { Stack } from 'expo-router';

export default function VehiclesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Vehicles' }} />
      <Stack.Screen name="[id]" options={{ title: 'Vehicle' }} />
      <Stack.Screen name="[id]/requests/[requestId]" options={{ title: 'Request' }} />
    </Stack>
  );
}
