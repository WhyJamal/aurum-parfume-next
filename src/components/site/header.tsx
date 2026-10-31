"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { SITE } from "@/data/perfumes";
import { useCart } from "@/lib/cart";

const LINKS = [
  { href: "#hero", label: "Bosh sahifa" },
  { href: "#hikoya", label: "Hikoya" },
  { href: "#kolleksiya", label: "Kolleksiya" },
  { href: "#aloqa", label: "Aloqa" },
];

export function Header() {
  const { count, pulse, setOpen } = useCart();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        solid ? "bg-black/70 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <a href="#hero" className="font-(family-name:--font-cormorant) text-xl tracking-[0.35em] text-[#e8c987]">
          {SITE.short}
        </a>

        <nav className="hidden gap-8 text-sm text-white/70 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-[#e8c987]">
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Savat"
          onClick={() => setOpen(true)}
          className="relative rounded-full border border-white/15 p-2.5 text-white/90 transition hover:border-[#e8c987]/60 hover:text-[#e8c987]"
        >
          <ShoppingBag className="size-5" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={pulse}
                initial={{ scale: 1.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#e8c987] text-[11px] font-semibold text-black"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
