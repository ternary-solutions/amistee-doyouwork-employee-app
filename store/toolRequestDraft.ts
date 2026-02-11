import type { Tool } from "@/types/tools";
import { create } from "zustand";

export type CartItem = { tool_id: string; quantity: number };

interface ToolRequestDraftStore {
  /** Cart items to pre-populate when opening create modal from catalog */
  catalogPendingCart: CartItem[];
  /** When true, tools index should open create modal on focus (e.g. returning from catalog) */
  openCreateModalOnReturn: boolean;
  /** Draft in-progress request saved before navigating to catalog */
  draftCart: CartItem[];
  draftPickup: string;
  draftMessage: string;
  addFromCatalog: (tool: Tool) => void;
  saveDraftBeforeCatalog: (
    cart: CartItem[],
    pickup: string,
    message: string,
  ) => void;
  consumeCatalogPending: () => {
    pending: CartItem[];
    draft: { cart: CartItem[]; pickup: string; message: string };
  };
  clearCatalogPending: () => void;
}

export const useToolRequestDraftStore = create<ToolRequestDraftStore>(
  (set, get) => ({
    catalogPendingCart: [],
    openCreateModalOnReturn: false,
    draftCart: [],
    draftPickup: "",
    draftMessage: "",

    addFromCatalog: (tool: Tool) => {
      set((state) => {
        const existing = state.catalogPendingCart.find(
          (c) => c.tool_id === tool.id,
        );
        const newCart = existing
          ? state.catalogPendingCart.map((c) =>
              c.tool_id === tool.id
                ? { ...c, quantity: Math.min(c.quantity + 1, tool.total_stock) }
                : c,
            )
          : [...state.catalogPendingCart, { tool_id: tool.id, quantity: 1 }];
        return {
          catalogPendingCart: newCart,
          openCreateModalOnReturn: true,
        };
      });
    },

    saveDraftBeforeCatalog: (cart, pickup, message) => {
      set({
        draftCart: [...cart],
        draftPickup: pickup,
        draftMessage: message,
        openCreateModalOnReturn: true,
      });
    },

    consumeCatalogPending: () => {
      const { catalogPendingCart, draftCart, draftPickup, draftMessage } =
        get();
      set({
        catalogPendingCart: [],
        openCreateModalOnReturn: false,
        draftCart: [],
        draftPickup: "",
        draftMessage: "",
      });
      return {
        pending: catalogPendingCart,
        draft: { cart: draftCart, pickup: draftPickup, message: draftMessage },
      };
    },

    clearCatalogPending: () =>
      set({
        catalogPendingCart: [],
        openCreateModalOnReturn: false,
        draftCart: [],
        draftPickup: "",
        draftMessage: "",
      }),
  }),
);
