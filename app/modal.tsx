import { Redirect } from 'expo-router';

/**
 * Modal template leftover - redirects to main app dashboard.
 */
export default function ModalScreen() {
  return <Redirect href="/(app)/dashboard" />;
}
