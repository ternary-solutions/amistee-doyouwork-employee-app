import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Expenses', showBack: false, animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="[id]" options={{ title: 'Expense Details', showBack: true }} />
    </Stack>
  );
}
