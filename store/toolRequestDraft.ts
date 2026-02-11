import type { Tool } from '@/types/tools';
import { create } from 'zustand';

export type CartItem = { tool_id: string; quantity: number };

interface ToolRequestDraftStore {
  /** Cart items to pre-populate when opening create modal from catalog */
  catalogPendingCart: CartItem[];
  /** When true, tools index should open create modal on focus (e.g. returning from catalog) */
  openCreateModalOnReturn: boolean;
  addFromCatalog: (tool: Tool) => void;
  consumeCatalogPending: () => CartItem[];
  clearCatalogPending: () => void;
}

export const useToolRequestDraftStore = create<ToolRequestDraftStore>((set, get) => ({
  catalogPendingCart: [],
  openCreateModalOnReturn: false,

  addFromCatalog: (tool: Tool) => {
    set((state) => {
      const existing = state.catalogPendingCart.find((c) => c.tool_id === tool.id);
      const newCart = existing
        ? state.catalogPendingCart.map((c) =>
            c.tool_id === tool.id
              ? { ...c, quantity: Math.min(c.quantity + 1, tool.total_stock) }
              : c
          )
        : [...state.catalogPendingCart, { tool_id: tool.id, quantity: 1 }];
      return {
        catalogPendingCart: newCart,
        openCreateModalOnReturn: true,
      };
    });
  },

  consumeCatalogPending: () => {
    const cart = get().catalogPendingCart;
    set({ catalogPendingCart: [], openCreateModalOnReturn: false });
    return cart;
  },

  clearCatalogPending: () => set({ catalogPendingCart: [], openCreateModalOnReturn: false }),
}));
