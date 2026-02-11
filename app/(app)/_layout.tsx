import { AppHeader } from "@/components/layout/AppHeader";
import { CustomDrawerContent } from "@/components/layout/DrawerContent";
import { DrawerModalProvider } from "@/contexts/DrawerModalContext";
import { useHeaderOptions } from "@/contexts/HeaderOptionsContext";
import type { DrawerNavigationOptions } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";

/** Custom options passed to AppHeader (not in DrawerNavigationOptions by default) */
type AppScreenOptions = DrawerNavigationOptions & {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  headerAction?: { label: string; onPress: () => void };
  showBack?: boolean;
};

function AppHeaderWithContext(props: {
  options?: AppScreenOptions;
  [key: string]: unknown;
}) {
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
    <DrawerModalProvider>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route }) => {
          const base = {
            drawerStyle: { width: "85%", maxWidth: 360 },
            headerShown: true,
            header: (p: unknown) => <AppHeaderWithContext {...(p as object)} />,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "transparent" },
          };
          const routeOptions: Record<string, Partial<AppScreenOptions>> = {
            dashboard: {
              drawerLabel: "My Dashboard",
              title: "Dashboard",
              headerShown: false,
            },
            schedule: {
              drawerLabel: "My Schedule",
              title: "My Schedule",
              showBack: false,
            },
            notifications: {
              drawerLabel: "Notifications",
              title: "Notifications",
            },
            tools: {
              drawerLabel: "Tool Requests",
              title: "Tools",
              showBack: false,
            },
            spiffs: { drawerLabel: "Spiffs", title: "Spiffs" },
            expenses: { drawerLabel: "Expenses", title: "Expenses" },
            vehicles: {
              drawerLabel: "Vehicles & Maintenance",
              title: "Vehicles",
              subtitle: "View fleet vehicles and maintenance requests.",
              showBack: false,
            },
            clothing: { drawerLabel: "Clothing Requests", title: "Clothing" },
            "time-off": {
              drawerLabel: "Time Off Requests",
              title: "Time Off",
              showBack: false,
            },
            resources: {
              drawerLabel: "Resources",
              title: "Resources",
              showBack: false,
            },
            suggestions: { drawerLabel: "Suggestions", title: "Suggestions" },
            contacts: { drawerLabel: "Contacts", title: "Contacts" },
            referrals: {
              drawerLabel: "Partner Companies",
              title: "Partner Companies",
            },
            settings: {
              drawerLabel: "Settings",
              title: "Settings",
              showBack: false,
            },
          };
          return { ...base, ...routeOptions[route.name] };
        }}
      />
    </DrawerModalProvider>
  );
}
