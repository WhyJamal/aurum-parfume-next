"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart, useUI, cartTotals } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

const links = [
  { href: "/", label: "Главная" },
  { href: "/collection", label: "Коллекция" },
  { href: "/showcase", label: "Шоу-рум" },
  // { href: "/#contact", label: "Контакты" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const { count } = cartTotals(lines);
  const bump = useUI((s) => s.bump);
  const { menuOpen, setMenuOpen, setCartOpen } = useUI();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "bg-[#0a0908]/70 py-1 backdrop-blur-xl border-b border-[#c9a96e]/15" : "py-3")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="font-display text-2xl tracking-[0.35em] text-[#f5efe6]">AURUM</Link>
          <nav className="hidden items-center gap-9 text-sm tracking-wide text-[#f5efe6]/75 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn("relative transition-colors hover:text-[#c9a96e] after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-[#c9a96e] after:transition-all hover:after:w-full", pathname === l.href ? "text-[#c9a96e] after:w-full" : "after:w-0")}>{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <motion.button
              key={bump}
              id="cart-button"
              aria-label="Корзина"
              onClick={() => setCartOpen(true)}
              initial={{ scale: bump ? 1.35 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}
              className="relative grid size-11 place-items-center rounded-full border border-[#c9a96e]/30 text-[#f5efe6] transition-colors hover:border-[#c9a96e] hover:bg-[#c9a96e]/10"
            >
              <ShoppingBag className="size-5" />
              {mounted && count > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#c9a96e] text-[11px] font-semibold text-[#0a0908]">{count}</span>
              )}
            </motion.button>
            <button aria-label="Меню" onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-full border border-[#c9a96e]/30 md:hidden">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col bg-[#0a0908] px-6 py-6 md:hidden"
            initial={{ clipPath: "circle(0% at 90% 5%)" }} animate={{ clipPath: "circle(150% at 90% 5%)" }} exit={{ clipPath: "circle(0% at 90% 5%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl tracking-[0.35em]">AURUM</span>
              <button aria-label="Закрыть" onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full border border-[#c9a96e]/30"><X className="size-5" /></button>
            </div>
            <nav className="mt-16 flex flex-1 flex-col gap-6">
              {links.map((l, i) => (
                <MotionLink
                  key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                  className="font-display text-5xl text-[#f5efe6] active:text-[#c9a96e]"
                >{l.label}</MotionLink>
              ))}
            </nav>
            <p className="text-sm text-[#a89c8a]">Доставка по Ташкенту</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
