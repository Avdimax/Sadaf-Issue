import { create } from "zustand";

/** Global order-theater state — any CTA can raise the curtain. */
type OrderState = {
  open: boolean;
  openOrder: () => void;
  closeOrder: () => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  open: false,
  openOrder: () => set({ open: true }),
  closeOrder: () => set({ open: false }),
}));
