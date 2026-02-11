import { AppHeader } from '@/components/layout/AppHeader';

/**
 * Shared stack screenOptions that use AppHeader with back button when not on index.
 * Use in stack layouts (e.g. notifications, vehicles, contacts).
 */
export function stackScreenOptionsWithAppHeader() {
  return {
    header: (props: { route: { name: string }; options?: { title?: string }; [key: string]: unknown }) => (
      <AppHeader
        {...props}
        title={props.options?.title as string}
        showBack={props.route.name !== 'index'}
      />
    ),
    headerShadowVisible: false,
  };
}
