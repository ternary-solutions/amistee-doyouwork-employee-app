import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    type ReactNode,
} from "react";

type CloseFn = () => void;

interface DrawerModalContextValue {
  /** Register a callback to close a modal/sheet when the drawer opens. Returns unregister fn. */
  registerModalClose: (fn: CloseFn) => () => void;
  /** Call all registered close callbacks (used by AppHeader before opening drawer) */
  closeModalsBeforeDrawer: () => void;
}

const DrawerModalContext = createContext<DrawerModalContextValue | undefined>(
  undefined,
);

export function DrawerModalProvider({ children }: { children: ReactNode }) {
  const callbacksRef = useRef<Set<CloseFn>>(new Set());

  const registerModalClose = useCallback((fn: CloseFn) => {
    callbacksRef.current.add(fn);
    return () => {
      callbacksRef.current.delete(fn);
    };
  }, []);

  const closeModalsBeforeDrawer = useCallback(() => {
    callbacksRef.current.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("[DrawerModalContext] Error closing modal:", e);
      }
    });
  }, []);

  const value: DrawerModalContextValue = {
    registerModalClose,
    closeModalsBeforeDrawer,
  };

  return (
    <DrawerModalContext.Provider value={value}>
      {children}
    </DrawerModalContext.Provider>
  );
}

export function useDrawerModalContext() {
  return useContext(DrawerModalContext);
}

/** Call from screens with modals - registers to close the modal when the user opens the drawer. */
export function useCloseModalOnDrawerOpen(close: () => void) {
  const ctx = useDrawerModalContext();
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerModalClose(() => closeRef.current());
  }, [ctx]);
}
