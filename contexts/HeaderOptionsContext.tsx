import {
  createContext,
  useCallback,
  useContext,
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

/** Call from screens that want to set title, subtitle, headerAction, showBack in the header. Clears on unmount. Options are only applied when the current route matches this screen (so still-mounted drawer screens can't overwrite the header). We use useLayoutEffect so options are applied before paint and the header updates correctly when navigating. Pass a stable options object (e.g. useMemo) to avoid unnecessary effect runs. */
export function useSetHeaderOptions(options: HeaderOptions | null) {
  const pathname = usePathname();
  const { setOptions } = useContext(HeaderOptionsContext) ?? {};
  useLayoutEffect(() => {
    setOptions?.(options, pathname);
    return () => setOptions?.(null, pathname);
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

  // Only apply when caller's pathname matches current route (prevents still-mounted screens from overwriting).
  // Don't clear on pathname change so the new screen can set its options and the header updates correctly when navigating.
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
