/**
 * App uses light mode only. Always returns 'light' regardless of system preference.
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
