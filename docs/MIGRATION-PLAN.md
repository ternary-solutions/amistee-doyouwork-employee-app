# Ionic → React Native Migration Plan

This document tracks the migration from the Ionic/Capacitor app (`doyouwork-employee-app`) to the React Native/Expo app (`amistee-doyouwork-employee-app`). Use the project skills for API mapping and per-screen porting:

- **API mapping**: `doyouwork-employee-app/.cursor/skills/ionic-to-react-native-migration/SKILL.md`
- **Per-screen workflow**: `doyouwork-employee-app/.cursor/skills/port-ionic-screen-to-rn/SKILL.md`

---

## 1. Screen parity

| Ionic route / page | RN route / screen | Status |
|--------------------|-------------------|--------|
| `/`, `/dashboard` | `/(app)/dashboard` | ✅ Ported |
| `/login` | `/(auth)/login` | ✅ Ported |
| `/forgot-password` | `/(auth)/forgot-password` | ✅ Ported |
| `/notifications` | `/(app)/notifications` (index) | ✅ Ported |
| `/notifications/:id` | `/(app)/notifications/[id]` | ✅ Ported |
| `/schedule` | `/(app)/schedule` | ✅ Ported (standalone screen; dashboard also shows schedule) |
| `/tools` | `/(app)/tools` | ✅ Ported |
| `/clothing` | `/(app)/clothing` | ✅ Ported |
| `/expenses` | `/(app)/expenses` | ✅ Ported |
| `/spiffs` | `/(app)/spiffs` | ✅ Ported |
| `/vehicles` | `/(app)/vehicles` (index) | ✅ Ported |
| `/vehicles/:id` | `/(app)/vehicles/[id]` | ✅ Ported |
| `/vehicles/:id/requests/:requestId` | `/(app)/vehicles/[id]/requests/[requestId]` | ✅ Ported |
| `/time-off` | `/(app)/time-off` | ✅ Ported |
| `/suggestions` | `/(app)/suggestions` | ✅ Ported |
| `/contacts` | `/(app)/contacts` (index) | ✅ Ported |
| `/contacts/:id` | `/(app)/contacts/[id]` | ✅ Ported |
| `/referrals` | `/(app)/referrals` | ✅ Ported |
| `/resources` | `/(app)/resources` | ✅ Ported |
| `/settings` | `/(app)/settings` | ✅ Ported |
| `*` (NotFound) | (handled by Expo Router) | N/A |

All main app screens exist in RN with matching navigation (drawer, stack params). Optional: run a **parity pass** (compare UI and behavior screen-by-screen with Ionic).

---

## 2. Services

| Service | Ionic | RN | Notes |
|---------|-------|-----|-------|
| auth | ✅ | ✅ | Login, refresh, logout |
| deviceTokens | ✅ | ✅ | Register/delete for push |
| expenses | ✅ | ✅ | |
| notifications | ✅ | ✅ | List, detail, mark read |
| pushNotifications | ✅ | ✅ | expo-notifications; tap → routeMap |
| referrals | ✅ | ✅ | |
| requests (clothings, repairs, timeOffs, tools) | ✅ | ✅ | |
| resources | ✅ | ✅ | |
| schedules | ✅ | ✅ | |
| spiffs | ✅ | ✅ | |
| suggestions | ✅ | ✅ | |
| tools | ✅ | ✅ | |
| users | ✅ | ✅ | |
| vehicles | ✅ | ✅ | |
| **locations** | ✅ | ✅ | Added for parity; store has `locations` / `currentLocationId` |
| **preferences** | ✅ | ✅ | preferences/me GET/PATCH; used in Settings notification toggles |
| media | ✅ | — | Ionic only (e.g. uploads); add in RN if needed (expo-image-picker) |
| tenants | ✅ | — | Add in RN if any screen needs it |
| specializations | ✅ | — | Add in RN if any screen needs it |

---

## 3. Infrastructure (done)

| Item | Status |
|------|--------|
| Token storage | ✅ `expo-secure-store`; same keys (`employee_access_token`, etc.) |
| Push notifications | ✅ expo-notifications; permission, token, backend register; tap → routeMap |
| Auth flow | ✅ Login, forgot-password, AppInitializer, logout |
| API client | ✅ `utils/api.ts` with auth, refresh, `X-Location-Id` |
| Navigation | ✅ Expo Router; drawer (app), stack (auth, notifications, vehicles, contacts) |
| Theme | ✅ Light mode only (`userInterfaceStyle: light`, `useColorScheme` → `'light'`) |
| Store | ✅ Zustand `main` store (me, role, locations, currentLocationId, etc.) |

---

## 4. Parity work completed (recent)

- **Schedule**: Standalone `/(app)/schedule` screen added; drawer shows "My Schedule".
- **Expenses**: Open/Closed filter and summary cards (Total Pending, Total Paid) added.
- **Time off**: Open/Closed filter added.
- **Settings**: Preferences service and types; profile photo section; personal info with Edit modal; notification toggles (job reminders, expense updates, spiff notifications) with Save; Change Password (navigate to forgot-password); Sign out. Users service: `update`, `updatePhoto` added.

## 5. Remaining / optional work

- **Parity pass**: Compare each RN screen to the Ionic version (layout, fields, validation, error messages).
- **Profile photo upload**: Wire "Change Photo" to `expo-image-picker` + `usersService.updatePhoto` (service ready).
- **Locations in UI**: If any screen should show a location picker or list, use `locationsService` and `setLocations` / `currentLocationId` (store already in place).
- **Camera / file uploads**: If expenses or other flows need photo upload, use `expo-image-picker` and `expo-file-system` per migration reference.
- **Cleanup**: Remove or repurpose Expo template leftovers (e.g. `(tabs)`, `explore`, `modal`) if not used.
- **NotFound**: Add an explicit 404 screen in RN if desired (Expo Router can show a default).

---

## 6. Next steps (suggested order)

1. ~~Add **locations** service to RN~~ ✅ (done in this pass).
2. Run a **parity pass** on 2–3 high-traffic screens (e.g. Dashboard, Login, Notifications).
3. **Populate locations** after login in RN if Ionic does (e.g. call `locationsService.list()` and `setLocations` in AppInitializer or after `fetchMe()`).
4. Optionally **add a locations service call** after login in RN to mirror Ionic behavior (if Ionic loads locations somewhere).
5. Remove or repurpose **unused (tabs)** routes if the app is drawer-only.
