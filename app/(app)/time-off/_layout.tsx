import { Stack } from "expo-router";

export default function TimeOffLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Time Off",
          showBack: false,
          animationTypeForReplace: "pop",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Time Off Request", showBack: true }}
      />
    </Stack>
  );
}
