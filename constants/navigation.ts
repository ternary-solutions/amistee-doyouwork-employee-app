/**
 * Menu structure and client info matching the Ionic app (navigation/menu.ts).
 * Used by the custom drawer and any header that needs route labels.
 */

export interface MenuItem {
  /** Drawer screen name (matches Drawer.Screen name in _layout) */
  name: string;
  label: string;
  icon: string; // Ionicons name
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: 'WORK TOOLS',
    items: [
      { name: 'dashboard', label: 'My Dashboard', icon: 'home' },
      { name: 'tools', label: 'Tool Requests', icon: 'construct' },
      { name: 'spiffs', label: 'Spiffs', icon: 'trophy' },
      { name: 'expenses', label: 'Expenses', icon: 'cash' },
      { name: 'vehicles', label: 'Vehicles & Maintenance', icon: 'car' },
      { name: 'clothing', label: 'Clothing Requests', icon: 'shirt' },
      { name: 'time-off', label: 'Time Off Requests', icon: 'calendar' },
      { name: 'resources', label: 'Resources', icon: 'library' },
      { name: 'suggestions', label: 'Suggestions', icon: 'bulb' },
    ],
  },
  {
    label: 'TEAM MEMBERS',
    items: [
      { name: 'contacts', label: 'Contacts', icon: 'people' },
      { name: 'referrals', label: 'Partner Companies', icon: 'business' },
    ],
  },
];

export const clientInfo = {
  name: 'Amistee Air Duct Cleaning',
};
