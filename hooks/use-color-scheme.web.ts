/**
 * App uses light mode only. Always returns 'light' (web uses same hook behavior).
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
