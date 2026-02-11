/**
 * Extract a user-facing message from API or JS errors.
 */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const e = err as {
    response?: { data?: { detail?: string }; status?: number };
    message?: string;
  };
  if (e?.response?.data?.detail && typeof e.response.data.detail === 'string') {
    return e.response.data.detail;
  }
  if (e?.message && typeof e.message === 'string') return e.message;
  return fallback;
}
