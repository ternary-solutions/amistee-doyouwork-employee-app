/**
 * Shared config for API/media URLs. Used by api.ts and mediaSource.ts
 * to avoid circular dependencies.
 *
 * Requires EXPO_PUBLIC_API_BASE_URL to be set (e.g. in .env).
 */

const API_BASE_ENV = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
const WS_NOTIFICATIONS_ENV = process.env
  .EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL as string | undefined;

function getApiBaseUrl(): string {
  const base = API_BASE_ENV?.trim();
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is required. Add it to your .env file. See .env.example for reference.",
    );
  }
  return base.endsWith("/") ? base : `${base}/`;
}

/** API/media base URL. Throws if EXPO_PUBLIC_API_BASE_URL is not set. */
export function getBaseUrl(_requireApiVersion = true): string {
  return getApiBaseUrl();
}

/**
 * WebSocket base for real-time notifications.
 * Uses EXPO_PUBLIC_WS_NOTIFICATIONS_BASE_URL if set, otherwise derives from API base.
 */
export function getWebSocketNotificationsBaseUrl(): string {
  const envBase = WS_NOTIFICATIONS_ENV?.trim();
  if (envBase) {
    const base = envBase.replace(/\/+$/, "");
    return base.startsWith("ws://") || base.startsWith("wss://")
      ? base
      : base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  }
  const httpBase = getApiBaseUrl().replace(/\/+$/, "");
  return httpBase.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
}
