import { useMainStore } from "@/store/main";
import { getBaseUrl } from "@/utils/config";

/** Placeholder image when no URL is provided. */
const PLACEHOLDER_IMAGE_URI =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" text-anchor="middle" fill="#64748b" font-size="36" font-family="system-ui,sans-serif">?</text></svg>',
  );

/** Full URL for a media file. Returns placeholder when url is empty. */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE_URI;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  if (url.startsWith("/media/serve/")) return `${baseUrl}${url}`;
  return `${baseUrl}/media/serve?path=${encodeURIComponent(url)}`;
}

/** Image source with auth headers for backend media. Use for <Image source={getMediaSource(url)} />. */
export function getMediaSource(url: string | null | undefined): {
  uri: string;
  headers?: Record<string, string>;
} {
  if (!url) return { uri: PLACEHOLDER_IMAGE_URI };
  if (url.startsWith("http://") || url.startsWith("https://"))
    return { uri: url };
  const uri = getMediaUrl(url);
  const token = useMainStore.getState().accessToken;
  if (token) return { uri, headers: { Authorization: `Bearer ${token}` } };
  return { uri };
}
