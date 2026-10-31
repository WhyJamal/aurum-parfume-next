"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Sparkles, Trash2, X } from "lucide-react";
import { PERFUMES, formatPrice } from "@/data/perfumes";
import { useCart } from "@/lib/cart";

export function CartSheet() {
  const { open, setOpen, lines, count, total, add, dec, remove, clear } = useCart();
  const [done, setDone] = useState(false);
  const items = PERFUMES.filter((p) => lines[p.slug]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setDone(false), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: bu yerga keyin API (buyurtmani bazaga yozish / Telegram) ulanadi
    clear();
    setDone(true);
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#e8c987]/70";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-neutral-950 text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl">Savat</h2>
              <button
                type="button"
                aria-label="Yopish"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/60 transition hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center"
              >
                <Sparkles className="size-10 text-[#e8c987]" />
                <h3 className="font-[family-name:var(--font-cormorant)] text-3xl">Rahmat!</h3>
                <p className="text-white/60">Buyurtmangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-[#e8c987] px-7 py-3 text-sm font-medium text-black"
                >
                  Yopish
                </button>
              </motion.div>
            ) : count === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center text-white/50">
                <p>Savat hozircha bo'sh.</p>
                <a
                  href="#kolleksiya"
                  onClick={() => setOpen(false)}
                  className="text-[#e8c987] underline-offset-4 hover:underline"
                >
                  Kolleksiyaga o'tish
                </a>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {items.map((p) => (
                    <li key={p.slug} className="flex gap-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <Image src={p.image} alt={p.name} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-[family-name:var(--font-cormorant)] text-lg">{p.name}</span>
                          <button
                            type="button"
                            aria-label="O'chirish"
                            onClick={() => remove(p.slug)}
                            className="text-white/40 transition hover:text-white"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <span className="text-xs text-white/45">{p.size}</span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-full border border-white/15 px-2 py-1">
                            <button type="button" aria-label="Kamaytirish" onClick={() => dec(p.slug)}>
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-4 text-center text-sm">{lines[p.slug]}</span>
                            <button type="button" aria-label="Ko'paytirish" onClick={() => add(p.slug)}>
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm text-[#e8c987]">{formatPrice(p.price * lines[p.slug])}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <form onSubmit={submit} className="space-y-3 border-t border-white/10 px-6 py-5">
                  <input required name="name" placeholder="Ismingiz" className={input} />
                  <input required name="phone" type="tel" placeholder="Telefon: +998 ..." className={input} />
                  <input required name="address" placeholder="Manzil" className={input} />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white/60">Jami</span>
                    <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#e8c987]">{formatPrice(total)}</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#e8c987] py-3.5 text-sm font-medium text-black transition hover:bg-[#f3dca4] active:scale-[0.99]"
                  >
                    Buyurtma berish
                  </button>
                </form>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
