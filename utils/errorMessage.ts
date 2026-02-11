/**
 * Extract a user-facing message from API or JS errors.
 * Handles both axios error (err.response) and thrown response (err is the response).
 */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const e = err as {
    response?: { data?: { detail?: string | Array<{ msg?: string; loc?: unknown }> } };
    data?: { detail?: string | Array<{ msg?: string; loc?: unknown }> };
    message?: string;
  };
  // When apiRequest throws the response object, error is the response (no .response)
  const data = e?.response?.data ?? e?.data;
  if (data?.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const msg = first?.msg ?? (typeof first === 'string' ? first : undefined);
      if (msg) return msg;
    }
  }
  if (e?.message && typeof e.message === 'string') return e.message;
  return fallback;
}
