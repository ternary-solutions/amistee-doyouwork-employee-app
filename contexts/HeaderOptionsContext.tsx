import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'expo-router';

export interface HeaderOptions {
  title?: string;
  subtitle?: string;
  /** Breadcrumb segments, e.g. ['Tools & Equipment', 'Catalog'] → "Tools & Equipment › Catalog" */
  breadcrumbs?: string[];
  headerAction?: { label: string; onPress: () => void };
  showBack?: boolean;
}

/** Second arg is the caller's pathname; options are only applied when it matches the current route. */
type SetHeaderOptions = (options: HeaderOptions | null, callerPathname?: string) => void;

interface HeaderOptionsContextValue {
  options: HeaderOptions | null;
  setOptions: SetHeaderOptions;
}

const HeaderOptionsContext = createContext<HeaderOptionsContextValue | undefined>(undefined);

/** Normalize path for comparison (strip (app) and other groups, collapse slashes) so "/(app)/tools" and "/tools" match. */
function normalizePath(p: string): string {
  return p
    .replace(/\/\([^)]+\)/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')
    .toLowerCase();
}

/** Call from screens that want to set title, subtitle, headerAction, showBack in the header. Clears on unmount. Options are only applied when the current route matches this screen (so still-mounted drawer screens can't overwrite the header). We use useEffect for applying so that when navigating back (e.g. from catalog to tools index) the screen has the updated pathname and its options are accepted. Pass a stable options object (e.g. useMemo) to avoid unnecessary effect runs. */
export function useSetHeaderOptions(options: HeaderOptions | null) {
  const pathname = usePathname();
  const { setOptions } = useContext(HeaderOptionsContext) ?? {};
  useLayoutEffect(() => {
    return () => setOptions?.(null, pathname);
  }, [setOptions, pathname]);
  useEffect(() => {
    setOptions?.(options, pathname);
  }, [setOptions, options, pathname]);
}

/** Read current header options (used by AppHeader). */
export function useHeaderOptions(): HeaderOptions | null {
  const ctx = useContext(HeaderOptionsContext);
  return ctx?.options ?? null;
}

export function HeaderOptionsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [options, setOptionsState] = useState<HeaderOptions | null>(null);

  // When the route changes, clear context so the header falls back to drawer/route options.
  useLayoutEffect(() => {
    setOptionsState(null);
  }, [pathname]);

  // Only apply when caller's pathname matches current route (prevents still-mounted screens like Clothing from overwriting).
  // Use normalized paths so "/(app)/tools" and "/tools" are treated as the same route.
  const setOptions = useCallback((o: HeaderOptions | null, callerPathname?: string) => {
    setOptionsState((prev) => {
      if (callerPathname != null && normalizePath(callerPathname) !== normalizePath(pathname)) return prev;
      return o;
    });
  }, [pathname]);

  const value: HeaderOptionsContextValue = {
    options,
    setOptions,
  };
  return (
    <HeaderOptionsContext.Provider value={value}>
      {children}
    </HeaderOptionsContext.Provider>
  );
}
