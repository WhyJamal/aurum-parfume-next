"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Volume } from "./products";
import { getProduct, DELIVERY_FEE, FREE_DELIVERY_FROM } from "./products";

export interface CartLine { slug: string; volume: Volume; qty: number }

interface CartState {
  lines: CartLine[];
  add: (slug: string, volume: Volume, qty?: number) => void;
  setQty: (slug: string, volume: Volume, qty: number) => void;
  remove: (slug: string, volume: Volume) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (slug, volume, qty = 1) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.slug === slug && l.volume === volume);
          if (i >= 0) {
            const lines = [...s.lines];
            lines[i] = { ...lines[i], qty: Math.min(lines[i].qty + qty, 20) };
            return { lines };
          }
          return { lines: [...s.lines, { slug, volume, qty }] };
        }),
      setQty: (slug, volume, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.slug === slug && l.volume === volume ? { ...l, qty: Math.min(qty, 20) } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (slug, volume) =>
        set((s) => ({ lines: s.lines.filter((l) => !(l.slug === slug && l.volume === volume)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "aurum-cart", skipHydration: false },
  ),
);

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => {
    const p = getProduct(l.slug);
    return sum + (p ? p.prices[l.volume] * l.qty : 0);
  }, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { subtotal, count, delivery, total: subtotal + delivery };
}

/* ---------- UI + effects ---------- */
export interface Flyer { id: number; src: string; from: { x: number; y: number; w: number; h: number }; to: { x: number; y: number } }

interface UIState {
  activeSlug: string | null;
  cartOpen: boolean;
  menuOpen: boolean;
  bump: number;
  flyers: Flyer[];
  openProduct: (slug: string | null) => void;
  setCartOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  fly: (f: Omit<Flyer, "id">) => void;
  landed: (id: number) => void;
}

let flyId = 0;
export const useUI = create<UIState>((set) => ({
  activeSlug: null,
  cartOpen: false,
  menuOpen: false,
  bump: 0,
  flyers: [],
  openProduct: (slug) => set({ activeSlug: slug }),
  setCartOpen: (v) => set({ cartOpen: v }),
  setMenuOpen: (v) => set({ menuOpen: v }),
  fly: (f) => set((s) => ({ flyers: [...s.flyers, { ...f, id: ++flyId }] })),
  landed: (id) => set((s) => ({ flyers: s.flyers.filter((f) => f.id !== id), bump: s.bump + 1 })),
}));
