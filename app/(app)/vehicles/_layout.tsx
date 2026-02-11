import { Stack } from 'expo-router';

export default function VehiclesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Vehicles', showBack: false, animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="[id]" options={{ title: 'Vehicle', showBack: true, animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="[id]/requests/[requestId]" options={{ title: 'Request', showBack: true }} />
    </Stack>
  );
}
