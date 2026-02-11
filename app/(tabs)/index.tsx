import { Redirect } from 'expo-router';

/**
 * (tabs) template leftover - redirects to main app dashboard.
 */
export default function TabsIndex() {
  return <Redirect href="/(app)/dashboard" />;
}
