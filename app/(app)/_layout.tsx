import { Drawer } from 'expo-router/drawer';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Drawer.Screen name="dashboard" options={{ drawerLabel: 'My Dashboard', title: 'Dashboard' }} />
      <Drawer.Screen name="notifications" options={{ drawerLabel: 'Notifications', title: 'Notifications' }} />
      <Drawer.Screen name="schedule" options={{ drawerLabel: 'Schedule', title: 'Schedule' }} />
      <Drawer.Screen name="tools" options={{ drawerLabel: 'Tool Requests', title: 'Tools' }} />
      <Drawer.Screen name="spiffs" options={{ drawerLabel: 'Spiffs', title: 'Spiffs' }} />
      <Drawer.Screen name="expenses" options={{ drawerLabel: 'Expenses', title: 'Expenses' }} />
      <Drawer.Screen name="vehicles" options={{ drawerLabel: 'Vehicles & Maintenance', title: 'Vehicles' }} />
      <Drawer.Screen name="clothing" options={{ drawerLabel: 'Clothing Requests', title: 'Clothing' }} />
      <Drawer.Screen name="time-off" options={{ drawerLabel: 'Time Off Requests', title: 'Time Off' }} />
      <Drawer.Screen name="resources" options={{ drawerLabel: 'Resources', title: 'Resources' }} />
      <Drawer.Screen name="suggestions" options={{ drawerLabel: 'Suggestions', title: 'Suggestions' }} />
      <Drawer.Screen name="contacts" options={{ drawerLabel: 'Contacts', title: 'Contacts' }} />
      <Drawer.Screen name="referrals" options={{ drawerLabel: 'Referrals', title: 'Referrals' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings', title: 'Settings' }} />
    </Drawer>
  );
}
