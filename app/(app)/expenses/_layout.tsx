import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Expenses' }} />
      <Stack.Screen name="[id]" options={{ title: 'Expense Details' }} />
    </Stack>
  );
}
