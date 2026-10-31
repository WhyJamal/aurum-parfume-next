"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { products, genderLabel, type Gender } from "@/lib/products";
import { useUI } from "@/lib/store";
import { formatPrice, cn } from "@/lib/utils";
import { TiltCard } from "@/components/aceternity/tilt-card";

const filters: { id: "all" | Gender; label: string }[] = [
  { id: "all", label: "Hammasi" },
  { id: "women", label: "Ayollar" },
  { id: "men", label: "Erkaklar" },
  { id: "unisex", label: "Uniseks" },
];

export function Shelf() {
  const [filter, setFilter] = useState<"all" | Gender>("all");
  const openProduct = useUI((s) => s.openProduct);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, left: 0, moved: false });
  const list = products.filter((p) => filter === "all" || p.gender === filter);

  return (
    <section id="collection" className="relative scroll-mt-10 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs uppercase tracking-[0.5em] text-[#c9a96e]">Kolleksiya</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="font-display mt-4 text-5xl font-light md:text-7xl">
          Javondagi <span className="italic text-[#c9a96e]">xazinalar</span>
        </motion.h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn("relative rounded-full border px-5 py-2 text-sm transition-colors", filter === f.id ? "border-[#c9a96e] text-[#0a0908]" : "border-[#c9a96e]/25 text-[#f5efe6]/70 hover:border-[#c9a96e]/60")}>
              {filter === f.id && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-[#c9a96e]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#a89c8a] md:hidden">← Suring →</p>
      </div>

      <div
        ref={rail}
        className="no-scrollbar group/list mt-8 flex cursor-grab gap-4 overflow-x-auto px-[6vw] pb-10 pt-10 snap-x snap-proximity active:cursor-grabbing md:gap-8"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          drag.current = { down: true, startX: e.clientX, left: rail.current!.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down) return;
          const dx = e.clientX - d.startX;
          if (Math.abs(dx) > 6) d.moved = true;
          rail.current!.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => { drag.current.down = false; }}
        onPointerLeave={() => { drag.current.down = false; }}
        onClickCapture={(e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } }}
      >
        {list.map((p, i) => (
          <motion.button
            layout
            key={p.slug}
            onClick={() => openProduct(p.slug)}
            initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
            className="group/item relative w-[78vw] max-w-[360px] shrink-0 snap-center text-left transition-opacity duration-500 group-hover/list:opacity-40 hover:opacity-100! md:w-[340px]"
          >
            <TiltCard className="relative">
              {/* glow */}
              <div aria-hidden className="absolute left-1/2 top-[45%] size-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover/item:opacity-60" style={{ background: p.accent }} />
              <div className="relative flex h-[440px] items-end justify-center pb-4 [transform:translateZ(40px)]">
                <Image
                  src={p.image} alt={p.name} width={400} height={520} draggable={false}
                  className="max-h-[400px] w-auto select-none object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-out group-hover/item:-translate-y-4 group-hover/item:scale-[1.07]"
                />
              </div>
              {/* shelf line + reflection */}
              <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
              <div aria-hidden className="h-8 w-full bg-gradient-to-b from-[#c9a96e]/15 to-transparent" />
            </TiltCard>
            <div className="mt-2 px-1">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#c9a96e]">{genderLabel[p.gender]}</p>
              <h3 className="font-display mt-1 text-3xl text-[#f5efe6]">{p.name}</h3>
              <p className="mt-1 text-sm text-[#a89c8a]">{p.tagline}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[#f5efe6]">{formatPrice(p.prices[50])} dan</span>
                <span className="rounded-full border border-[#c9a96e]/40 px-4 py-1.5 text-xs text-[#c9a96e] transition group-hover/item:bg-[#c9a96e] group-hover/item:text-[#0a0908]">Ko'rish</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
