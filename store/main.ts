import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location } from '@/types/locations';
import type { Notification } from '@/types/notifications';
import type { User, UserRole } from '@/types/users';
import { create } from 'zustand';

const CURRENT_LOCATION_KEY = 'currentLocationId';

interface MainStore {
  globalLoading: boolean;
  me: User | null;
  role: UserRole | null;
  accessToken: string | null;
  users: User[] | [];
  employees: User[] | [];
  locations: Location[] | [];
  notifications: Notification[] | [];
  notificationCount: number | 0;
  locationIds: string[] | [];
  currentLocationId: string | null;
  setGlobalLoading: (globalLoading: boolean) => void;
  setMe: (me: User | null) => void;
  setRole: (role: UserRole | null) => void;
  setAccessToken: (token: string | null) => void;
  setUsers: (users: User[] | []) => void;
  setEmployees: (users: User[] | []) => void;
  setLocations: (locations: Location[] | []) => void;
  setNotifications: (notifications: Notification[] | []) => void;
  setNotificationCount: (notificationCount: number) => void;
  setLocationIds: (locationIds: string[]) => void;
  setCurrentLocationId: (locationId: string | null) => void;
}

export const useMainStore = create<MainStore>((set, get) => ({
  globalLoading: false,
  me: null,
  role: null,
  accessToken: null,
  users: [],
  employees: [],
  locations: [],
  notifications: [],
  notificationCount: 0,
  locationIds: [],
  currentLocationId: null,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setMe: (me) => set({ me }),
  setRole: (role) => set({ role }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUsers: (users) => set({ users }),
  setEmployees: (users) => set({ users }),
  setLocations: (locations) => set({ locations }),
  setNotifications: (notifications) => set({ notifications }),
  setNotificationCount: (notificationCount) => set({ notificationCount }),
  setLocationIds: (locationIds) => set({ locationIds }),
  setCurrentLocationId: (locationId) => {
    set({ currentLocationId: locationId });
    AsyncStorage.setItem(CURRENT_LOCATION_KEY, locationId ?? '').catch(() => {});
  },
}));

export async function getStoredLocationId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(CURRENT_LOCATION_KEY);
    return value || null;
  } catch {
    return null;
  }
}
