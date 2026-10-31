"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { Card3D, Depth } from "@/components/aceternity/card-3d";
import { PERFUMES, formatPrice, type Perfume } from "@/data/perfumes";
import { useCart } from "@/lib/cart";

function Burst({ color }: { color: string }) {
  // "purkash" effekti: tugma ustidan kichik tomchilar sochiladi
  const dots = Array.from({ length: 10 });
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      {dots.map((_, i) => {
        const a = (i / dots.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 46, y: Math.sin(a) * 30 - 14, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute size-1.5 rounded-full"
            style={{ background: color }}
          />
        );
      })}
    </span>
  );
}

function Product({ p }: { p: Perfume }) {
  const { add, lines } = useCart();
  const [burst, setBurst] = useState(0);
  const qty = lines[p.slug] ?? 0;

  return (
    <Card3D className="h-full">
      <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 p-3 transition-colors hover:border-white/25">
        <Depth z={30}>
          {/* Hozir rasmlarda fon bor, shuning uchun object-cover. Fon olingach: object-contain + gradient fon */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </Depth>

        <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
          <Depth z={50}>
            <h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-white">{p.name}</h3>
            <p className="mt-1 text-sm text-white/55">{p.tagline}</p>
          </Depth>

          <Depth z={35} className="mt-4 flex flex-wrap gap-2">
            {[p.notes.top, p.notes.heart, p.notes.base].map((n, i) => (
              <span
                key={n}
                className="rounded-full border px-3 py-1 text-[11px] tracking-wide text-white/75"
                style={{ borderColor: `${p.accent}55` }}
                title={["Yuqori nota", "Yurak nota", "Baza nota"][i]}
              >
                {n}
              </span>
            ))}
          </Depth>

          <Depth z={45} className="mt-auto flex items-center justify-between pt-6">
            <div>
              <div className="text-lg text-[#e8c987]">{formatPrice(p.price)}</div>
              <div className="text-xs text-white/40">{p.size}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                add(p.slug);
                setBurst((b) => b + 1);
              }}
              className="relative flex items-center gap-2 rounded-full bg-[#e8c987] px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#f3dca4] active:scale-95"
            >
              {qty > 0 ? <Check className="size-4" /> : <Plus className="size-4" />}
              {qty > 0 ? `Savatda: ${qty}` : "Savatga"}
              <AnimatePresence>
                {burst > 0 && <Burst key={burst} color={p.accent} />}
              </AnimatePresence>
            </button>
          </Depth>
        </div>
      </div>
    </Card3D>
  );
}

export function Collection() {
  return (
    <section id="kolleksiya" className="relative bg-black py-28">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-14 max-w-xl"
        >
          <p className="text-xs uppercase tracking-[0.5em] text-[#e8c987]/80">Kolleksiya</p>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl text-white md:text-6xl">Beshta hid, beshta kayfiyat</h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PERFUMES.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
            >
              <Product p={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
