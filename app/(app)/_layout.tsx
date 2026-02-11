import { AppHeader } from '@/components/layout/AppHeader';
import { CustomDrawerContent } from '@/components/layout/DrawerContent';
import { useHeaderOptions } from '@/contexts/HeaderOptionsContext';
import type { DrawerNavigationOptions } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';

/** Custom options passed to AppHeader (not in DrawerNavigationOptions by default) */
type AppScreenOptions = DrawerNavigationOptions & {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  headerAction?: { label: string; onPress: () => void };
  showBack?: boolean;
};

function AppHeaderWithContext(props: { options?: AppScreenOptions; [key: string]: unknown }) {
  const contextOpts = useHeaderOptions();
  const opts = props.options as AppScreenOptions | undefined;
  return (
    <AppHeader
      {...props}
      title={contextOpts?.title ?? opts?.title}
      subtitle={contextOpts?.subtitle ?? opts?.subtitle}
      breadcrumbs={contextOpts?.breadcrumbs ?? opts?.breadcrumbs}
      headerAction={contextOpts?.headerAction ?? opts?.headerAction}
      showBack={contextOpts?.showBack ?? opts?.showBack}
    />
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { width: '85%', maxWidth: 360 },
        headerShown: true,
        header: (props) => {
          return <AppHeaderWithContext {...props} />;
        },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Drawer.Screen name="dashboard" options={{ drawerLabel: 'My Dashboard', title: 'Dashboard', headerShown: false }} />
      <Drawer.Screen name="schedule" options={{ drawerLabel: 'My Schedule', title: 'My Schedule', showBack: false } as AppScreenOptions} />
      <Drawer.Screen name="notifications" options={{ drawerLabel: 'Notifications', title: 'Notifications' }} />
      <Drawer.Screen name="tools" options={{ drawerLabel: 'Tool Requests', title: 'Tools', showBack: false } as AppScreenOptions} />
      <Drawer.Screen name="spiffs" options={{ drawerLabel: 'Spiffs', title: 'Spiffs' }} />
      <Drawer.Screen name="expenses" options={{ drawerLabel: 'Expenses', title: 'Expenses' }} />
      <Drawer.Screen name="vehicles" options={{ drawerLabel: 'Vehicles & Maintenance', title: 'Vehicles' }} />
      <Drawer.Screen name="clothing" options={{ drawerLabel: 'Clothing Requests', title: 'Clothing' }} />
      <Drawer.Screen name="time-off" options={{ drawerLabel: 'Time Off Requests', title: 'Time Off', showBack: false } as AppScreenOptions} />
      <Drawer.Screen name="resources" options={{ drawerLabel: 'Resources', title: 'Resources', showBack: false } as AppScreenOptions} />
      <Drawer.Screen name="suggestions" options={{ drawerLabel: 'Suggestions', title: 'Suggestions' }} />
      <Drawer.Screen name="contacts" options={{ drawerLabel: 'Contacts', title: 'Contacts' }} />
      <Drawer.Screen name="referrals" options={{ drawerLabel: 'Partner Companies', title: 'Partner Companies' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings', title: 'Settings', showBack: false } as AppScreenOptions} />
    </Drawer>
  );
}
