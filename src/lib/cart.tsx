"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { PERFUMES } from "@/data/perfumes";

type Lines = Record<string, number>; // slug -> qty

type Action =
  | { type: "add"; slug: string }
  | { type: "dec"; slug: string }
  | { type: "remove"; slug: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: Lines };

function reducer(state: Lines, a: Action): Lines {
  switch (a.type) {
    case "hydrate":
      return a.lines;
    case "add":
      return { ...state, [a.slug]: (state[a.slug] ?? 0) + 1 };
    case "dec": {
      const q = (state[a.slug] ?? 0) - 1;
      const next = { ...state };
      if (q <= 0) delete next[a.slug];
      else next[a.slug] = q;
      return next;
    }
    case "remove": {
      const next = { ...state };
      delete next[a.slug];
      return next;
    }
    case "clear":
      return {};
  }
}

type CartCtx = {
  lines: Lines;
  count: number;
  total: number;
  open: boolean;
  pulse: number; // har add da oshadi (badge animatsiyasi uchun)
  setOpen: (v: boolean) => void;
  add: (slug: string) => void;
  dec: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "aurum-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, {});
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const skipNext = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        skipNext.current = true; // birinchi yozishda localStorage'ni bo'sh holat bilan bosib yubormaslik uchun
        dispatch({ type: "hydrate", lines: JSON.parse(raw) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add = useCallback((slug: string) => {
    dispatch({ type: "add", slug });
    setPulse((p) => p + 1);
  }, []);

  const value = useMemo<CartCtx>(() => {
    const count = Object.values(lines).reduce((a, b) => a + b, 0);
    const total = Object.entries(lines).reduce((sum, [slug, q]) => {
      const p = PERFUMES.find((x) => x.slug === slug);
      return sum + (p ? p.price * q : 0);
    }, 0);
    return {
      lines,
      count,
      total,
      open,
      pulse,
      setOpen,
      add,
      dec: (slug) => dispatch({ type: "dec", slug }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [lines, open, pulse, add]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
