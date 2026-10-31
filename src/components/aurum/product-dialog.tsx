"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, ShoppingBag, Check } from "lucide-react";
import { getProduct, genderLabel, type Volume } from "@/lib/products";
import { useCart, useUI } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatedPrice } from "./animated-number";
import { TiltCard } from "@/components/aceternity/tilt-card";
import { Sparkles } from "@/components/aceternity/sparkles";

export function ProductDialog() {
  const slug = useUI((s) => s.activeSlug);
  const openProduct = useUI((s) => s.openProduct);
  const product = slug ? getProduct(slug) : undefined;

  useEffect(() => {
    document.documentElement.style.overflow = product ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openProduct(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, openProduct]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="dialog" role="dialog" aria-modal="true" aria-label={product.name}
          className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => openProduct(null)} />
          <Content key={product.slug} slug={product.slug} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Content({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const [volume, setVolume] = useState<Volume>(50);
  const [added, setAdded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const add = useCart((s) => s.add);
  const { fly, openProduct, setCartOpen } = useUI();

  const onAdd = () => {
    add(product.slug, volume);
    const from = imgRef.current?.getBoundingClientRect();
    const to = document.getElementById("cart-button")?.getBoundingClientRect();
    if (from && to) fly({ src: product.image, from: { x: from.left + from.width * 0.25, y: from.top, w: from.width * 0.5, h: from.height * 0.8 }, to: { x: to.left + to.width / 2 - 11, y: to.top + to.height / 2 - 15 } });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      data-lenis-prevent
      className="relative grid max-h-[94svh] w-full max-w-5xl grid-cols-1 overflow-y-auto rounded-t-3xl border border-[#c9a96e]/25 bg-[#0f0c0a] md:max-h-[88vh] md:grid-cols-2 md:rounded-3xl"
      initial={{ y: 80, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <button onClick={() => openProduct(null)} aria-label="Yopish" className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-[#c9a96e]/30 bg-[#0a0908]/70 backdrop-blur hover:border-[#c9a96e]"><X className="size-5" /></button>

      <div className="relative grid min-h-[320px] place-items-center overflow-hidden bg-gradient-to-b from-[#1a1510] to-[#0a0908] p-8 md:min-h-[560px]">
        <motion.div aria-hidden className="absolute size-[70%] rounded-full blur-3xl" style={{ background: product.accent }} initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 1.2 }} />
        <Sparkles count={14} />
        <TiltCard className="relative" max={16}>
          <div ref={imgRef} className="animate-float [transform:translateZ(60px)]">
            <Image src={product.image} alt={product.name} width={400} height={520} priority className="max-h-[300px] w-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.7)] md:max-h-[460px]" />
          </div>
        </TiltCard>
      </div>

      <div className="flex flex-col p-6 md:p-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#c9a96e]">{genderLabel[product.gender]}</p>
        <h3 className="font-display mt-2 text-5xl font-light">{product.name}</h3>
        <p className="mt-1 italic text-[#c9a96e]/80">{product.tagline}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#f5efe6]/70">{product.description}</p>

        <div className="mt-6 grid gap-2">
          {([["Yuqori nota", product.notes.top], ["O'rta nota", product.notes.heart], ["Baza nota", product.notes.base]] as const).map(([label, notes], i) => (
            <motion.div key={label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
              className="flex items-center justify-between rounded-xl border border-[#c9a96e]/15 bg-[#c9a96e]/[0.04] px-4 py-2.5" style={{ marginInline: `${(2 - i) * 6}px` }}>
              <span className="text-[11px] uppercase tracking-widest text-[#a89c8a]">{label}</span>
              <span className="text-sm text-[#f5efe6]">{notes.join(" · ")}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {([50, 100] as Volume[]).map((v) => (
            <button key={v} onClick={() => setVolume(v)} className={cn("relative flex-1 rounded-xl border py-3 text-sm transition-colors", volume === v ? "border-[#c9a96e] text-[#0a0908]" : "border-[#c9a96e]/25 text-[#f5efe6]/80 hover:border-[#c9a96e]/60")}>
              {volume === v && <motion.span layoutId="vol-pill" className="absolute inset-0 rounded-xl bg-[#c9a96e]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="relative font-medium">{v} ml</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
          <div className="font-display text-4xl text-[#f5efe6]"><AnimatedPrice value={product.prices[volume]} /></div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e9c98a] px-7 py-3.5 text-sm font-semibold text-[#0a0908] shadow-[0_0_30px_rgba(201,169,110,.35)] transition hover:shadow-[0_0_45px_rgba(201,169,110,.55)]">
            {added ? <><Check className="size-4" /> Qo'shildi</> : <><ShoppingBag className="size-4" /> Savatga</>}
          </motion.button>
        </div>
        {added && (
          <button onClick={() => { openProduct(null); setCartOpen(true); }} className="mt-3 text-left text-sm text-[#c9a96e] underline underline-offset-4">Savatni ochish →</button>
        )}
      </div>
    </motion.div>
  );
}
