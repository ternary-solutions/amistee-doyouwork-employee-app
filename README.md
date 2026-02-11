# Do You Work – Employee Mobile App

The mobile application for field employees of **Amistee Air Duct Cleaning and Insulation, Inc.** Part of the broader Amistee operations management system alongside the Admin Portal and API backend.

**Version:** 1.0.0  
**Developed by:** Ternary Solutions, Inc.  
**Client:** Amistee Air Duct Cleaning and Insulation, Inc.

---

## Table of Contents

1. [Overview](#overview)
2. [System Context](#system-context)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Configuration](#configuration)
9. [Development](#development)
10. [Building & Deployment](#building--deployment)
11. [Related Repositories](#related-repositories)
12. [Copyright & License](#copyright--license)

---

## Overview

The **Do You Work** employee app provides self-service access for field employees to:

- View schedules and daily assignments
- Manage time-off requests
- Submit and track tool and clothing requests
- Record expenses and view spiffs
- Access vehicle information and maintenance
- Browse company resources and submit suggestions
- View team contacts and partner company referrals
- Receive real-time and push notifications

The app uses **email/password** or **phone OTP** login and restricts access to users with the Employee role. It communicates with the [Amistee Service Management API](https://github.com/ternary-solutions/amistee-dyw) for all data.

---

## System Context

This app is one of three applications in the Amistee operations ecosystem:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Amistee Operations System                     │
├──────────────────┬────────────────────┬──────────────────────────┤
│   Admin Portal   │   Employee App     │   FastAPI Backend        │
│ (admin-doyouwork)│ (this repository)  │   (amistee-dyw)          │
│                  │                    │                          │
│ • Full system    │ • Employee self-   │ • REST API               │
│   administration │   service          │ • WebSocket notifications│
│ • Managers &     │ • Field employees  │ • PostgreSQL, Redis      │
│   Admins         │   only             │ • Celery, S3, SES, etc.  │
└──────────────────┴────────────────────┴──────────────────────────┘
```

For full system architecture, deployment, and backend capabilities, see the [amistee-dyw README](https://github.com/ternary-solutions/amistee-dyw).

---

## Features

### Work Tools

| Feature                    | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Dashboard**              | Daily schedule by date, vehicle assignments, team members, vacation overview |
| **Tool Requests**          | Request tools from catalog; track status and history                         |
| **Spiffs**                 | View spiff payments and status                                               |
| **Expenses**               | Submit and track expense reports                                             |
| **Vehicles & Maintenance** | Fleet vehicles, details, repair requests                                     |
| **Clothing Requests**      | Request company clothing; track fulfillment                                  |
| **Time Off**               | Request PTO; view approvals and upcoming vacations                           |
| **Resources**              | Company resource library and documents                                       |
| **Suggestions**            | Submit and view suggestions                                                  |

### Team Members

| Feature               | Description                               |
| --------------------- | ----------------------------------------- |
| **Contacts**          | Browse employees by location with search  |
| **Partner Companies** | View referral/partner company information |

### General

- **Notifications** – In-app list and real-time WebSocket updates
- **Push Notifications** – Expo push for alerts when app is backgrounded
- **Settings** – Profile, preferences, push notification toggle
- **Drawer navigation** – Side menu with grouped sections

---

## Technology Stack

| Category          | Technology                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Framework**     | [Expo](https://expo.dev) ~54                                                                                               |
| **Routing**       | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based)                                                     |
| **UI**            | React Native 0.81, React 19                                                                                                |
| **State**         | [Zustand](https://zustand-demo.pmnd.rs/) (auth, store), [TanStack Query](https://tanstack.com/query/latest) (server state) |
| **HTTP**          | Axios, with JWT auth and token refresh                                                                                     |
| **Storage**       | expo-secure-store (tokens), AsyncStorage                                                                                   |
| **UI Components** | Custom components, @gorhom/bottom-sheet, Ionicons                                                                          |
| **Media**         | expo-image, expo-image-picker, expo-file-system                                                                            |
| **Notifications** | expo-notifications, WebSocket                                                                                              |
| **Forms/Date**    | @react-native-community/datetimepicker                                                                                     |

---

## Project Structure

```
amistee-doyouwork-employee-app/
├── app/                         # Expo Router file-based routes
│   ├── (app)/                   # Authenticated app screens
│   │   ├── dashboard.tsx
│   │   ├── schedule.tsx
│   │   ├── tools/
│   │   ├── spiffs/
│   │   ├── expenses/
│   │   ├── vehicles/
│   │   ├── clothing/
│   │   ├── time-off/
│   │   ├── resources.tsx
│   │   ├── suggestions/
│   │   ├── contacts/
│   │   ├── referrals/
│   │   ├── notifications/
│   │   └── settings.tsx
│   ├── (auth)/                  # Login, forgot password
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   └── index.tsx                # Entry: token check → auth or dashboard
├── components/
│   ├── layout/                  # AppHeader, DrawerContent
│   ├── dashboard/
│   ├── document/
│   ├── tools/
│   └── ui/                      # Button, Card, ListCard, etc.
├── constants/
│   ├── navigation.ts            # Menu groups, client info
│   └── theme.ts
├── contexts/
│   ├── DrawerModalContext.tsx
│   ├── HeaderOptionsContext.tsx
│   └── NotificationContext.tsx  # WebSocket + in-app notifications
├── hooks/
├── services/                    # API service modules
│   ├── auth.ts
│   ├── schedules.ts
│   ├── vehicles.ts
│   ├── expenses.ts
│   ├── spiffs.ts
│   ├── tools.ts
│   ├── notifications.ts
│   ├── requests/                # timeOffs, clothings, tools
│   └── ...
├── store/
│   ├── main.ts                  # Zustand store (me, tokens, etc.)
│   └── toolRequestDraft.ts
├── types/
├── utils/
│   ├── api.ts                   # apiRequest, login, logout, fetchMe
│   ├── config.ts                # API/WebSocket URL config
│   ├── mediaSource.ts           # Media URL resolution
│   └── tokenStorage.ts
├── .env.example
├── app.json
└── package.json
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Expo CLI** (installed via `npx expo`)
- **iOS Simulator** (Xcode) or **Android Emulator** (Android Studio), or **Expo Go** on a physical device

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd amistee-doyouwork-employee-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example env file and configure the API URL:

```bash
cp .env.example .env
```

Edit `.env` and set your backend API base URL (see [Configuration](#configuration)).

### 4. Start the App

```bash
npx expo start
```

Then choose an option:

- **Expo Go** – Scan QR code with Expo Go on your device
- **iOS Simulator** – Press `i` in the terminal
- **Android Emulator** – Press `a` in the terminal
- **Web** – Press `w` for static web build

The app uses [file-based routing](https://docs.expo.dev/router/introduction/) via `expo-router`. Screens live under `app/` and map to URLs automatically.

---

## Configuration

### Required Environment Variables

| Variable                   | Description                                   | Example                    |
| -------------------------- | --------------------------------------------- | -------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL (include trailing slash) | `https://api.example.com/` |

### Optional

| Variable                                | Description                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL` | WebSocket notifications URL. If unset, derived from API base (http→ws, https→wss). |

### Example `.env`

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com/

# Optional: override WebSocket URL
# EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL=wss://your-api.example.com/ws/notifications
```

### Backend Requirements

The API backend (amistee-dyw) must be running and reachable. Ensure:

- CORS includes your dev or production origin if needed
- JWT auth is enabled
- WebSocket endpoint is available for real-time notifications

See the [backend README](https://github.com/ternary-solutions/amistee-dyw) for API setup.

---

## Development

### Running Locally

```bash
npx expo start
```

Use `--clear` to clear the Metro bundler cache:

```bash
npx expo start --clear
```

### Linting

```bash
npm run lint
```

### Architecture Notes

- **Auth flow** – `app/index.tsx` checks for stored tokens; if present, redirects to dashboard; otherwise to login. After login, tokens are stored in SecureStore and `fetchMe` populates the main store.
- **API layer** – `utils/api.ts` provides `apiRequest` with JWT in headers, automatic refresh on 401, and `X-Location-Id` for location-scoped endpoints.
- **Notifications** – `NotificationContext` fetches notifications via REST and subscribes to WebSocket for real-time updates. Push tokens are registered with the backend via `PushNotificationSetup` / `deviceTokens`.

---

## Building & Deployment

The project is configured for [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services). The `app.json` includes an EAS project ID and owner. The `eas.json` defines build profiles (development, preview, production) and submit profiles for store submission.

### EAS Secrets (Required for Production Builds)

Production builds need `EXPO_PUBLIC_API_BASE_URL` at build time. Set it in EAS:

```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://your-production-api.com/" --type string
```

Optional, if you use a different WebSocket URL for notifications:

```bash
eas secret:create --name EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL --value "wss://your-api.com/ws/notifications" --type string
```

### EAS Build (Expo)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for production (iOS + Android)
eas build --platform all --profile production

# Build for iOS only
eas build --platform ios --profile production

# Build for Android only
eas build --platform android --profile production
```

### EAS Submit (Store Submission)

After a production build completes:

```bash
# Submit latest iOS build to App Store Connect (TestFlight)
eas submit --platform ios --latest --non-interactive

# Submit latest Android build to Google Play Console
eas submit --platform android --latest --non-interactive
```

Build and auto-submit in one step:

```bash
eas build --platform all --profile production --auto-submit
```

**Before submitting:**

- **iOS:** Replace `YOUR_APP_STORE_CONNECT_APP_ID` in `eas.json` under `submit.production.ios.ascAppId` with your App Store Connect app ID (numeric ID from App Information).
- **Android:** Create a [Google Service Account](https://docs.expo.dev/submit/android#creating-a-google-service-account) and upload your app manually at least once before API submissions work.

### Development vs Production

- Use `.env` (or `.env.local`) for local development with a dev API URL.
- For production builds, set `EXPO_PUBLIC_API_BASE_URL` via EAS secrets (see above).

---

## Related Repositories

| Repository          | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| **amistee-dyw**     | FastAPI backend – REST API, WebSocket, PostgreSQL, Celery, etc. |
| **admin-doyouwork** | Admin web portal for managers and administrators                |

---

## Copyright & License

**Copyright © Amistee Air Duct Cleaning and Insulation, Inc. All rights reserved.**

This software was developed by **Ternary Solutions, Inc.** under a work-for-hire contract for Amistee Air Duct Cleaning and Insulation, Inc. This is proprietary software and all rights are owned by Amistee Air Duct Cleaning and Insulation, Inc.

---

**Last Updated:** February 2025
